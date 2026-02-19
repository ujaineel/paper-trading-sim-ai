import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config";
import { dbPlugin } from "./plugins/db";
import { authPlugin } from "./plugins/auth";
import { authRoutes } from "./routes/auth.routes";
import { portfolioRoutes } from "./routes/portfolio.routes";
import { tradingRoutes } from "./routes/trading.routes";
import { priceRoutes } from "./routes/prices.routes";
import { sentimentRoutes } from "./routes/sentiment.routes";
import { screenerRoutes } from "./routes/screener.routes";
import { watchlistRoutes } from "./routes/watchlist.routes";

async function main() {
  const app = Fastify({
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    },
  });

  // --- Plugins ---
  await app.register(cors, { origin: true });
  await app.register(dbPlugin);
  await app.register(authPlugin);

  // --- Routes ---
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(portfolioRoutes, { prefix: "/portfolios" });
  await app.register(tradingRoutes, { prefix: "/portfolios" });
  await app.register(priceRoutes, { prefix: "/prices" });
  await app.register(sentimentRoutes, { prefix: "/sentiment" });
  await app.register(screenerRoutes, { prefix: "/screener" });
  await app.register(watchlistRoutes, { prefix: "/watchlists" });

  // --- Health Check ---
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  // --- Start ---
  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`🚀 Trading Simulator API running on http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
