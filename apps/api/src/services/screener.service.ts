import { sql, desc } from "drizzle-orm";
import { sentimentScores } from "@trading-sim/shared/db/schema";
import type { Database } from "@trading-sim/shared/db";
import { SP500_MAP } from "@trading-sim/shared/constants";
import { PriceService } from "./price.service";

interface ScreenerFilter {
  field: string;
  op: "gte" | "lte" | "gt" | "lt" | "eq";
  value: number;
}

interface ScreenerResult {
  ticker: string;
  company: string;
  price?: number;
  changePercent?: number;
  sentimentAvg7d?: number;
  articleCount?: number;
}

const PRESETS = [
  {
    name: "Bullish Sentiment",
    description: "Stocks with strongest positive sentiment over 7 days",
    filters: [{ field: "sentimentAvg7d", op: "gte" as const, value: 2 }],
  },
  {
    name: "Bearish Sentiment",
    description: "Stocks with strongest negative sentiment over 7 days",
    filters: [{ field: "sentimentAvg7d", op: "lte" as const, value: -2 }],
  },
  {
    name: "High Volume Dip",
    description: "Stocks dipping with positive sentiment (potential buy signal)",
    filters: [
      { field: "sentimentAvg7d", op: "gte" as const, value: 1 },
      { field: "priceChangePercent1d", op: "lte" as const, value: -2 },
    ],
  },
  {
    name: "Momentum + Sentiment",
    description: "Rising stocks with rising sentiment",
    filters: [
      { field: "sentimentAvg7d", op: "gte" as const, value: 2 },
      { field: "priceChangePercent1d", op: "gte" as const, value: 1 },
    ],
  },
];

export class ScreenerService {
  constructor(
    private db: Database,
    private priceService: PriceService,
  ) {}

  getPresets() {
    return PRESETS;
  }

  async runScreen(filters: ScreenerFilter[]): Promise<ScreenerResult[]> {
    // Step 1: Get sentiment data for all tickers
    const sentimentData = await this.db
      .select({
        ticker: sentimentScores.ticker,
        avgScore: sql<number>`AVG(${sentimentScores.avgScore})`.as("avg_score"),
        articleCount: sql<number>`COUNT(*)`.as("article_count"),
      })
      .from(sentimentScores)
      .groupBy(sentimentScores.ticker)
      .orderBy(desc(sql`AVG(${sentimentScores.avgScore})`));

    // Build a map of sentiment data
    const sentimentMap = new Map(
      sentimentData.map((s) => [
        s.ticker,
        { avgScore: Number(s.avgScore), articleCount: Number(s.articleCount) },
      ]),
    );

    // Step 2: Determine which tickers need price data
    const needsPriceData = filters.some(
      (f) =>
        f.field === "priceChangePercent1d" ||
        f.field === "price",
    );

    // Get tickers to screen (union of sentiment tickers and all S&P 500)
    const tickers = [...new Set([...sentimentMap.keys()])];

    // Step 3: Fetch price data if needed
    const priceMap = new Map<
      string,
      { price: number; changePercent: number }
    >();
    if (needsPriceData && tickers.length > 0) {
      // Only fetch prices for tickers that pass sentiment filters first
      const priceTickers = tickers.slice(0, 50); // Limit to avoid API rate limits
      const quotes = await this.priceService.getBatchQuotes(priceTickers);
      for (const q of quotes) {
        priceMap.set(q.ticker, {
          price: q.price,
          changePercent: q.changePercent,
        });
      }
    }

    // Step 4: Apply filters
    const results: ScreenerResult[] = [];
    for (const ticker of tickers) {
      const sentiment = sentimentMap.get(ticker);
      const price = priceMap.get(ticker);

      const record: Record<string, number> = {
        sentimentAvg7d: sentiment?.avgScore ?? 0,
        articleCount: sentiment?.articleCount ?? 0,
        priceChangePercent1d: price?.changePercent ?? 0,
        price: price?.price ?? 0,
      };

      const passesAll = filters.every((f) => {
        const val = record[f.field];
        if (val == null) return false;
        switch (f.op) {
          case "gte": return val >= f.value;
          case "lte": return val <= f.value;
          case "gt":  return val > f.value;
          case "lt":  return val < f.value;
          case "eq":  return val === f.value;
          default:    return false;
        }
      });

      if (passesAll) {
        results.push({
          ticker,
          company: SP500_MAP[ticker] ?? ticker,
          price: price?.price,
          changePercent: price?.changePercent,
          sentimentAvg7d: sentiment?.avgScore,
          articleCount: sentiment?.articleCount,
        });
      }
    }

    return results;
  }
}
