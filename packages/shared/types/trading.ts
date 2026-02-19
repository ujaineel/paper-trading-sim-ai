// ── Order Side ──────────────────────────────────────────────
export const ORDER_SIDES = ["BUY", "SELL", "SHORT", "COVER"] as const;
export type OrderSide = (typeof ORDER_SIDES)[number];

// ── Order Type ─────────────────────────────────────────────
export const ORDER_TYPES = ["MARKET", "LIMIT", "STOP_LOSS"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

// ── Order Status ───────────────────────────────────────────
export const ORDER_STATUSES = [
  "PENDING",
  "FILLED",
  "PARTIAL",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ── DTOs ───────────────────────────────────────────────────

export interface CreateOrderDTO {
  ticker: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  expiresAt?: string; // ISO 8601
}

export interface OrderDTO {
  id: string;
  portfolioId: string;
  ticker: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  limitPrice: number | null;
  stopPrice: number | null;
  filledPrice: number | null;
  status: OrderStatus;
  rejectionReason: string | null;
  createdAt: string;
  filledAt: string | null;
  expiresAt: string | null;
}

export interface TradeDTO {
  id: string;
  orderId: string;
  portfolioId: string;
  ticker: string;
  side: OrderSide;
  quantity: number;
  executionPrice: number;
  totalValue: number;
  realizedPnl: number;
  commission: number;
  executedAt: string;
}

export interface PositionDTO {
  id: string;
  portfolioId: string;
  ticker: string;
  quantity: number;
  avgCostBasis: number;
  currentValue: number;
  updatedAt: string;
}

export interface PortfolioSummaryDTO {
  id: string;
  userId: string;
  name: string;
  cashBalance: number;
  initialBalance: number;
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  positions: PositionDTO[];
  createdAt: string;
}

// ── Trading Engine Config ──────────────────────────────────

export interface TradingConfig {
  slippageBps: number; // basis points, e.g. 5 = 0.05%
  commission: number; // flat $ per trade
  enforceMarketHours: boolean;
}

export const DEFAULT_TRADING_CONFIG: TradingConfig = {
  slippageBps: 5,
  commission: 0,
  enforceMarketHours: true,
};
