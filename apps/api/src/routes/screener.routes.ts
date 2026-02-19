import type { FastifyInstance } from "fastify";
import { ScreenerService } from "../services/screener.service";
import { PriceService } from "../services/price.service";
import { authGuard } from "../middleware/auth.guard";

export async function screenerRoutes(app: FastifyInstance) {
  const priceService = new PriceService();
  const screenerService = new ScreenerService(app.db, priceService);

  app.addHook("preHandler", authGuard);

  // GET /screener/presets
  app.get("/presets", async () => {
    return { presets: screenerService.getPresets() };
  });

  // POST /screener/run
  app.post("/run", async (request) => {
    const { filters } = request.body as {
      filters: Array<{
        field: string;
        op: "gte" | "lte" | "gt" | "lt" | "eq";
        value: number;
      }>;
    };

    if (!filters || !Array.isArray(filters) || filters.length === 0) {
      return { results: [] };
    }

    const results = await screenerService.runScreen(filters);
    return { results };
  });
}
