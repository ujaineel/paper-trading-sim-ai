import { eq, and } from "drizzle-orm";
import { portfolios, positions } from "@trading-sim/shared/db/schema";
import type { Database } from "@trading-sim/shared/db";
import { NotFoundError, ForbiddenError } from "../utils/errors";

export class PortfolioService {
  constructor(private db: Database) {}

  async create(userId: string, name: string, initialBalance: number) {
    const balanceStr = initialBalance.toFixed(2);

    const [portfolio] = await this.db
      .insert(portfolios)
      .values({
        userId,
        name,
        cashBalance: balanceStr,
        initialBalance: balanceStr,
      })
      .returning();

    return this.formatPortfolio(portfolio);
  }

  async listByUser(userId: string) {
    const results = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId));

    return results.map(this.formatPortfolio);
  }

  async getById(portfolioId: string, userId: string) {
    const [portfolio] = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .limit(1);

    if (!portfolio) throw new NotFoundError("Portfolio");
    if (portfolio.userId !== userId) throw new ForbiddenError();

    // Fetch positions
    const positionRows = await this.db
      .select()
      .from(positions)
      .where(eq(positions.portfolioId, portfolioId));

    const positionsFormatted = positionRows.map((p) => ({
      id: p.id,
      portfolioId: p.portfolioId,
      ticker: p.ticker,
      quantity: p.quantity,
      avgCostBasis: parseFloat(p.avgCostBasis),
      currentValue: p.currentValue ? parseFloat(p.currentValue) : 0,
      updatedAt: p.updatedAt.toISOString(),
    }));

    const positionsValue = positionsFormatted.reduce(
      (sum, p) => sum + p.currentValue,
      0,
    );
    const cashBalance = parseFloat(portfolio.cashBalance);
    const initialBalance = parseFloat(portfolio.initialBalance);
    const totalValue = cashBalance + positionsValue;
    const totalPnl = totalValue - initialBalance;
    const totalPnlPercent =
      initialBalance > 0 ? (totalPnl / initialBalance) * 100 : 0;

    return {
      ...this.formatPortfolio(portfolio),
      totalValue: +totalValue.toFixed(2),
      totalPnl: +totalPnl.toFixed(2),
      totalPnlPercent: +totalPnlPercent.toFixed(2),
      positions: positionsFormatted,
    };
  }

  async delete(portfolioId: string, userId: string) {
    const [portfolio] = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .limit(1);

    if (!portfolio) throw new NotFoundError("Portfolio");
    if (portfolio.userId !== userId) throw new ForbiddenError();

    await this.db.delete(portfolios).where(eq(portfolios.id, portfolioId));
  }

  /** Verify ownership and return the portfolio row */
  async verifyOwnership(portfolioId: string, userId: string) {
    const [portfolio] = await this.db
      .select()
      .from(portfolios)
      .where(
        and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)),
      )
      .limit(1);

    if (!portfolio) throw new NotFoundError("Portfolio");
    return portfolio;
  }

  private formatPortfolio(p: typeof portfolios.$inferSelect) {
    return {
      id: p.id,
      userId: p.userId,
      name: p.name,
      cashBalance: parseFloat(p.cashBalance),
      initialBalance: parseFloat(p.initialBalance),
      createdAt: p.createdAt.toISOString(),
    };
  }
}
