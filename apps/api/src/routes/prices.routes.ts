import type { FastifyInstance } from "fastify";
import { PriceService } from "../services/price.service";
import { authGuard } from "../middleware/auth.guard";

export async function priceRoutes(app: FastifyInstance) {
  const priceService = new PriceService();

  app.addHook("preHandler", authGuard);

  // GET /prices/:ticker
  app.get("/:ticker", async (request) => {
    const { ticker } = request.params as { ticker: string };
    const quote = await priceService.getQuote(ticker.toUpperCase());
    return quote;
  });

  // GET /prices/batch?tickers=AAPL,GOOG,MSFT
  app.get("/batch", async (request) => {
    const { tickers } = request.query as { tickers?: string };

    if (!tickers) {
      return { quotes: [] };
    }

    const tickerList = tickers
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

    const quotes = await priceService.getBatchQuotes(tickerList);
    return { quotes };
  });
}
