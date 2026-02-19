import type { FastifyInstance } from "fastify";
import { TradingService } from "../services/trading.service";
import { PriceService } from "../services/price.service";
import { PortfolioService } from "../services/portfolio.service";
import { authGuard } from "../middleware/auth.guard";
import type { CreateOrderDTO } from "@trading-sim/shared/types";

export async function tradingRoutes(app: FastifyInstance) {
  const priceService = new PriceService();
  const tradingService = new TradingService(
    app.db,
    (ticker) => priceService.getPrice(ticker),
  );
  const portfolioService = new PortfolioService(app.db);

  // All trading routes are protected
  app.addHook("preHandler", authGuard);

  // POST /portfolios/:id/orders
  app.post("/:id/orders", async (request, reply) => {
    const { id: portfolioId } = request.params as { id: string };
    const dto = request.body as CreateOrderDTO;

    // Verify ownership
    await portfolioService.verifyOwnership(portfolioId, request.user.userId);

    const result = await tradingService.submitOrder(portfolioId, dto);
    return reply.status(201).send(result);
  });

  // GET /portfolios/:id/orders
  app.get("/:id/orders", async (request) => {
    const { id: portfolioId } = request.params as { id: string };
    const { status, ticker } = request.query as {
      status?: string;
      ticker?: string;
    };

    await portfolioService.verifyOwnership(portfolioId, request.user.userId);

    const orders = await tradingService.getOrders(portfolioId, {
      status,
      ticker,
    });
    return { orders };
  });

  // DELETE /portfolios/:id/orders/:orderId
  app.delete("/:id/orders/:orderId", async (request) => {
    const { id: portfolioId, orderId } = request.params as {
      id: string;
      orderId: string;
    };

    await portfolioService.verifyOwnership(portfolioId, request.user.userId);

    const order = await tradingService.cancelOrder(orderId, portfolioId);
    return { order };
  });

  // GET /portfolios/:id/trades
  app.get("/:id/trades", async (request) => {
    const { id: portfolioId } = request.params as { id: string };
    const { ticker, from, to } = request.query as {
      ticker?: string;
      from?: string;
      to?: string;
    };

    await portfolioService.verifyOwnership(portfolioId, request.user.userId);

    return tradingService.getTrades(portfolioId, { ticker, from, to });
  });
}
