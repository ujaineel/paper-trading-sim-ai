import { eq, and, sql } from "drizzle-orm";
import {
  orders,
  trades,
  positions,
  portfolios,
} from "@trading-sim/shared/db/schema";
import type { Database } from "@trading-sim/shared/db";
import type { CreateOrderDTO, OrderSide } from "@trading-sim/shared/types";
import { SP500_MAP } from "@trading-sim/shared/constants";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { isMarketOpen, applySlippage } from "../utils/market-hours";
import { config } from "../config";

export class TradingService {
  constructor(
    private db: Database,
    private getPrice: (ticker: string) => Promise<number>,
  ) {}

  async submitOrder(
    portfolioId: string,
    dto: CreateOrderDTO,
  ) {
    // ── 1. Validate ticker ──
    if (!SP500_MAP[dto.ticker]) {
      throw new BadRequestError(
        `Unknown ticker: ${dto.ticker}. Only S&P 500 tickers are supported.`,
      );
    }

    // ── 2. Validate quantity ──
    if (!Number.isInteger(dto.quantity) || dto.quantity < 1) {
      throw new BadRequestError("Quantity must be a positive integer");
    }

    // ── 3. Check market hours ──
    if (config.enforceMarketHours && !isMarketOpen()) {
      throw new BadRequestError(
        "Market is closed. Orders accepted Mon–Fri 9:30 AM – 4:00 PM ET.",
      );
    }

    // ── 4. Validate limit/stop prices ──
    if (dto.orderType === "LIMIT" && dto.limitPrice == null) {
      throw new BadRequestError("Limit orders require a limitPrice");
    }
    if (dto.orderType === "STOP_LOSS" && dto.stopPrice == null) {
      throw new BadRequestError("Stop-loss orders require a stopPrice");
    }

    // ── 5. Fetch portfolio ──
    const [portfolio] = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .limit(1);

    if (!portfolio) throw new NotFoundError("Portfolio");

    // ── 6. For MARKET orders, execute immediately ──
    if (dto.orderType === "MARKET") {
      return this.executeMarketOrder(portfolio, dto);
    }

    // ── 7. For LIMIT / STOP_LOSS, store as PENDING ──
    const [order] = await this.db
      .insert(orders)
      .values({
        portfolioId,
        ticker: dto.ticker,
        side: dto.side,
        orderType: dto.orderType,
        quantity: dto.quantity,
        limitPrice: dto.limitPrice?.toFixed(4) ?? null,
        stopPrice: dto.stopPrice?.toFixed(4) ?? null,
        status: "PENDING",
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      })
      .returning();

    return { order: this.formatOrder(order), trade: null };
  }

  private async executeMarketOrder(
    portfolio: typeof portfolios.$inferSelect,
    dto: CreateOrderDTO,
  ) {
    const currentPrice = await this.getPrice(dto.ticker);
    const executionPrice = applySlippage(
      currentPrice,
      dto.side,
      config.slippageBps,
    );
    const totalValue = +(executionPrice * dto.quantity).toFixed(2);
    const cashBalance = parseFloat(portfolio.cashBalance);

    // ── Validate funds / shares ──
    if (dto.side === "BUY" || dto.side === "COVER") {
      if (cashBalance < totalValue) {
        throw new BadRequestError(
          `Insufficient funds. Required: $${totalValue.toFixed(2)}, Available: $${cashBalance.toFixed(2)}`,
        );
      }
    }

    if (dto.side === "SELL" || dto.side === "SHORT") {
      if (dto.side === "SELL") {
        const [position] = await this.db
          .select()
          .from(positions)
          .where(
            and(
              eq(positions.portfolioId, portfolio.id),
              eq(positions.ticker, dto.ticker),
            ),
          )
          .limit(1);

        if (!position || position.quantity < dto.quantity) {
          throw new BadRequestError(
            `Insufficient shares. You hold ${position?.quantity ?? 0} shares of ${dto.ticker}.`,
          );
        }
      }
    }

    // ── Insert order as FILLED ──
    const now = new Date();
    const [order] = await this.db
      .insert(orders)
      .values({
        portfolioId: portfolio.id,
        ticker: dto.ticker,
        side: dto.side,
        orderType: "MARKET",
        quantity: dto.quantity,
        filledPrice: executionPrice.toFixed(4),
        status: "FILLED",
        filledAt: now,
      })
      .returning();

    // ── Calculate realized P&L (for sells) ──
    let realizedPnl = 0;
    if (dto.side === "SELL") {
      const [position] = await this.db
        .select()
        .from(positions)
        .where(
          and(
            eq(positions.portfolioId, portfolio.id),
            eq(positions.ticker, dto.ticker),
          ),
        )
        .limit(1);

      if (position) {
        realizedPnl = +(
          (executionPrice - parseFloat(position.avgCostBasis)) *
          dto.quantity
        ).toFixed(2);
      }
    }

    // ── Insert trade record ──
    const [trade] = await this.db
      .insert(trades)
      .values({
        orderId: order.id,
        portfolioId: portfolio.id,
        ticker: dto.ticker,
        side: dto.side,
        quantity: dto.quantity,
        executionPrice: executionPrice.toFixed(4),
        totalValue: totalValue.toFixed(2),
        realizedPnl: realizedPnl.toFixed(2),
        commission: config.commission.toFixed(2),
        executedAt: now,
      })
      .returning();

    // ── Update position ──
    await this.updatePosition(
      portfolio.id,
      dto.ticker,
      dto.side,
      dto.quantity,
      executionPrice,
    );

    // ── Update cash balance ──
    const cashDelta =
      dto.side === "BUY" || dto.side === "COVER"
        ? -totalValue
        : totalValue;

    await this.db
      .update(portfolios)
      .set({
        cashBalance: (cashBalance + cashDelta).toFixed(2),
      })
      .where(eq(portfolios.id, portfolio.id));

    return { order: this.formatOrder(order), trade: this.formatTrade(trade) };
  }

  private async updatePosition(
    portfolioId: string,
    ticker: string,
    side: OrderSide,
    quantity: number,
    executionPrice: number,
  ) {
    const [existing] = await this.db
      .select()
      .from(positions)
      .where(
        and(
          eq(positions.portfolioId, portfolioId),
          eq(positions.ticker, ticker),
        ),
      )
      .limit(1);

    if (side === "BUY" || side === "COVER") {
      if (existing) {
        // Update average cost basis and quantity
        const oldQty = existing.quantity;
        const oldCost = parseFloat(existing.avgCostBasis);
        const newQty = oldQty + quantity;
        const newAvgCost =
          (oldCost * oldQty + executionPrice * quantity) / newQty;

        await this.db
          .update(positions)
          .set({
            quantity: newQty,
            avgCostBasis: newAvgCost.toFixed(4),
            currentValue: (newQty * executionPrice).toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(positions.id, existing.id));
      } else {
        await this.db.insert(positions).values({
          portfolioId,
          ticker,
          quantity,
          avgCostBasis: executionPrice.toFixed(4),
          currentValue: (quantity * executionPrice).toFixed(2),
        });
      }
    } else if (side === "SELL" || side === "SHORT") {
      if (existing) {
        const newQty = existing.quantity - quantity;
        if (newQty <= 0) {
          // Close position
          await this.db
            .delete(positions)
            .where(eq(positions.id, existing.id));
        } else {
          await this.db
            .update(positions)
            .set({
              quantity: newQty,
              currentValue: (newQty * executionPrice).toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(positions.id, existing.id));
        }
      }
    }
  }

  async getOrders(
    portfolioId: string,
    filters?: { status?: string; ticker?: string },
  ) {
    let query = this.db
      .select()
      .from(orders)
      .where(eq(orders.portfolioId, portfolioId));

    // Note: additional filters would be applied via and() in production
    const results = await query;

    let filtered = results;
    if (filters?.status) {
      filtered = filtered.filter((o) => o.status === filters.status);
    }
    if (filters?.ticker) {
      filtered = filtered.filter((o) => o.ticker === filters.ticker);
    }

    return filtered.map(this.formatOrder);
  }

  async cancelOrder(orderId: string, portfolioId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.portfolioId, portfolioId)))
      .limit(1);

    if (!order) throw new NotFoundError("Order");
    if (order.status !== "PENDING") {
      throw new BadRequestError(
        `Cannot cancel order with status: ${order.status}`,
      );
    }

    const [updated] = await this.db
      .update(orders)
      .set({ status: "CANCELLED" })
      .where(eq(orders.id, orderId))
      .returning();

    return this.formatOrder(updated);
  }

  async getTrades(
    portfolioId: string,
    filters?: { ticker?: string; from?: string; to?: string },
  ) {
    const results = await this.db
      .select()
      .from(trades)
      .where(eq(trades.portfolioId, portfolioId));

    let filtered = results;
    if (filters?.ticker) {
      filtered = filtered.filter((t) => t.ticker === filters.ticker);
    }
    if (filters?.from) {
      const fromDate = new Date(filters.from);
      filtered = filtered.filter((t) => t.executedAt >= fromDate);
    }
    if (filters?.to) {
      const toDate = new Date(filters.to);
      filtered = filtered.filter((t) => t.executedAt <= toDate);
    }

    const formattedTrades = filtered.map(this.formatTrade);

    const summary = {
      totalTrades: formattedTrades.length,
      totalRealizedPnl: +formattedTrades
        .reduce((sum, t) => sum + t.realizedPnl, 0)
        .toFixed(2),
      totalVolume: +formattedTrades
        .reduce((sum, t) => sum + t.totalValue, 0)
        .toFixed(2),
    };

    return { trades: formattedTrades, summary };
  }

  private formatOrder(o: typeof orders.$inferSelect) {
    return {
      id: o.id,
      portfolioId: o.portfolioId,
      ticker: o.ticker,
      side: o.side,
      orderType: o.orderType,
      quantity: o.quantity,
      limitPrice: o.limitPrice ? parseFloat(o.limitPrice) : null,
      stopPrice: o.stopPrice ? parseFloat(o.stopPrice) : null,
      filledPrice: o.filledPrice ? parseFloat(o.filledPrice) : null,
      status: o.status,
      rejectionReason: o.rejectionReason,
      createdAt: o.createdAt.toISOString(),
      filledAt: o.filledAt?.toISOString() ?? null,
      expiresAt: o.expiresAt?.toISOString() ?? null,
    };
  }

  private formatTrade(t: typeof trades.$inferSelect) {
    return {
      id: t.id,
      orderId: t.orderId,
      portfolioId: t.portfolioId,
      ticker: t.ticker,
      side: t.side,
      quantity: t.quantity,
      executionPrice: parseFloat(t.executionPrice),
      totalValue: parseFloat(t.totalValue),
      realizedPnl: parseFloat(t.realizedPnl),
      commission: parseFloat(t.commission),
      executedAt: t.executedAt.toISOString(),
    };
  }
}
