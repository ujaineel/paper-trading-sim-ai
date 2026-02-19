import type { FastifyInstance } from "fastify";
import { SentimentService } from "../services/sentiment.service";
import { authGuard } from "../middleware/auth.guard";

export async function sentimentRoutes(app: FastifyInstance) {
  const sentimentService = new SentimentService(app.db);

  app.addHook("preHandler", authGuard);

  // GET /sentiment/:ticker?days=7
  app.get("/:ticker", async (request) => {
    const { ticker } = request.params as { ticker: string };
    const { days } = request.query as { days?: string };

    return sentimentService.getTickerSentiment(
      ticker.toUpperCase(),
      days ? parseInt(days, 10) : 7,
    );
  });

  // GET /sentiment/movers?direction=positive&limit=10
  app.get("/movers", async (request) => {
    const { direction, limit } = request.query as {
      direction?: "positive" | "negative";
      limit?: string;
    };

    const movers = await sentimentService.getTopMovers(
      direction ?? "positive",
      limit ? parseInt(limit, 10) : 10,
    );
    return { movers };
  });
}
