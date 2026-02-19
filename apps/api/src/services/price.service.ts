import NodeCache from "node-cache";
import { config } from "../config";

interface PriceQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  previousClose: number;
}

export class PriceService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: config.priceCacheTtlSeconds,
      checkperiod: 30,
    });
  }

  async getPrice(ticker: string): Promise<number> {
    const quote = await this.getQuote(ticker);
    return quote.price;
  }

  async getQuote(ticker: string): Promise<PriceQuote> {
    const cached = this.cache.get<PriceQuote>(ticker);
    if (cached) return cached;

    const quote = await this.fetchFromYahoo(ticker);
    this.cache.set(ticker, quote);
    return quote;
  }

  async getBatchQuotes(tickers: string[]): Promise<PriceQuote[]> {
    const results: PriceQuote[] = [];
    const toFetch: string[] = [];

    // Check cache first
    for (const ticker of tickers) {
      const cached = this.cache.get<PriceQuote>(ticker);
      if (cached) {
        results.push(cached);
      } else {
        toFetch.push(ticker);
      }
    }

    // Fetch missing quotes in parallel (batches of 5 to avoid rate limits)
    const batchSize = 5;
    for (let i = 0; i < toFetch.length; i += batchSize) {
      const batch = toFetch.slice(i, i + batchSize);
      const quotes = await Promise.allSettled(
        batch.map((t) => this.fetchFromYahoo(t)),
      );

      for (let j = 0; j < quotes.length; j++) {
        const result = quotes[j];
        if (result.status === "fulfilled") {
          this.cache.set(batch[j], result.value);
          results.push(result.value);
        }
      }
    }

    return results;
  }

  private async fetchFromYahoo(ticker: string): Promise<PriceQuote> {
    const url = `${config.yahooFinanceBaseUrl}/v8/finance/chart/${ticker}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Yahoo Finance API error for ${ticker}: ${response.status}`,
      );
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      throw new Error(`No data returned for ticker: ${ticker}`);
    }

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? 0;
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? 0;
    const change = +(price - previousClose).toFixed(2);
    const changePercent =
      previousClose > 0 ? +((change / previousClose) * 100).toFixed(2) : 0;

    return {
      ticker,
      price,
      change,
      changePercent,
      volume: meta.regularMarketVolume ?? 0,
      marketCap: meta.marketCap ?? 0,
      previousClose,
    };
  }
}
