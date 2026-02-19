import type { FastifyInstance } from "fastify";
import { PortfolioService } from "../services/portfolio.service";
import { authGuard } from "../middleware/auth.guard";

export async function portfolioRoutes(app: FastifyInstance) {
  const portfolioService = new PortfolioService(app.db);

  // All portfolio routes are protected
  app.addHook("preHandler", authGuard);

  // POST /portfolios
  app.post("/", async (request, reply) => {
    const { name, initialBalance } = request.body as {
      name: string;
      initialBalance: number;
    };

    if (!name || initialBalance == null || initialBalance <= 0) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "name and a positive initialBalance are required",
      });
    }

    const portfolio = await portfolioService.create(
      request.user.userId,
      name,
      initialBalance,
    );
    return reply.status(201).send({ portfolio });
  });

  // GET /portfolios
  app.get("/", async (request) => {
    const portfolios = await portfolioService.listByUser(request.user.userId);
    return { portfolios };
  });

  // GET /portfolios/:id
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const portfolio = await portfolioService.getById(id, request.user.userId);
    return portfolio;
  });

  // DELETE /portfolios/:id
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await portfolioService.delete(id, request.user.userId);
    return reply.status(204).send();
  });
}
