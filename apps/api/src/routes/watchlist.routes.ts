import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { watchlists, watchlistItems } from "@trading-sim/shared/db/schema";
import { authGuard } from "../middleware/auth.guard";
import { NotFoundError, ForbiddenError } from "../utils/errors";

export async function watchlistRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard);

  // POST /watchlists
  app.post("/", async (request, reply) => {
    const { name, tickers } = request.body as {
      name: string;
      tickers?: string[];
    };

    if (!name) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "name is required",
      });
    }

    const [watchlist] = await app.db
      .insert(watchlists)
      .values({ userId: request.user.userId, name })
      .returning();

    // Add initial tickers if provided
    if (tickers && tickers.length > 0) {
      await app.db.insert(watchlistItems).values(
        tickers.map((ticker) => ({
          watchlistId: watchlist.id,
          ticker: ticker.toUpperCase(),
        })),
      );
    }

    return reply.status(201).send({ watchlist: formatWatchlist(watchlist) });
  });

  // GET /watchlists
  app.get("/", async (request) => {
    const results = await app.db
      .select()
      .from(watchlists)
      .where(eq(watchlists.userId, request.user.userId));

    return { watchlists: results.map(formatWatchlist) };
  });

  // POST /watchlists/:id/items
  app.post("/:id/items", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { ticker } = request.body as { ticker: string };

    // Verify ownership
    const [watchlist] = await app.db
      .select()
      .from(watchlists)
      .where(eq(watchlists.id, id))
      .limit(1);

    if (!watchlist) throw new NotFoundError("Watchlist");
    if (watchlist.userId !== request.user.userId) throw new ForbiddenError();

    const [item] = await app.db
      .insert(watchlistItems)
      .values({ watchlistId: id, ticker: ticker.toUpperCase() })
      .returning();

    return reply.status(201).send({
      item: {
        id: item.id,
        watchlistId: item.watchlistId,
        ticker: item.ticker,
        addedAt: item.addedAt.toISOString(),
      },
    });
  });

  // DELETE /watchlists/:id/items/:ticker
  app.delete("/:id/items/:ticker", async (request, reply) => {
    const { id, ticker } = request.params as { id: string; ticker: string };

    // Verify ownership
    const [watchlist] = await app.db
      .select()
      .from(watchlists)
      .where(eq(watchlists.id, id))
      .limit(1);

    if (!watchlist) throw new NotFoundError("Watchlist");
    if (watchlist.userId !== request.user.userId) throw new ForbiddenError();

    await app.db
      .delete(watchlistItems)
      .where(
        and(
          eq(watchlistItems.watchlistId, id),
          eq(watchlistItems.ticker, ticker.toUpperCase()),
        ),
      );

    return reply.status(204).send();
  });
}

function formatWatchlist(w: typeof watchlists.$inferSelect) {
  return {
    id: w.id,
    userId: w.userId,
    name: w.name,
    createdAt: w.createdAt.toISOString(),
  };
}
