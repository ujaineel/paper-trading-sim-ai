import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Users ──────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Portfolios ─────────────────────────────────────────────

export const portfolios = pgTable("portfolios", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cashBalance: numeric("cash_balance", { precision: 14, scale: 2 }).notNull(),
  initialBalance: numeric("initial_balance", {
    precision: 14,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Positions ──────────────────────────────────────────────

export const positions = pgTable("positions", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolios.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(),
  quantity: integer("quantity").notNull(),
  avgCostBasis: numeric("avg_cost_basis", {
    precision: 14,
    scale: 4,
  }).notNull(),
  currentValue: numeric("current_value", { precision: 14, scale: 2 }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Orders ─────────────────────────────────────────────────

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolios.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(),
  side: text("side").notNull(), // BUY | SELL | SHORT | COVER
  orderType: text("order_type").notNull(), // MARKET | LIMIT | STOP_LOSS
  quantity: integer("quantity").notNull(),
  limitPrice: numeric("limit_price", { precision: 14, scale: 4 }),
  stopPrice: numeric("stop_price", { precision: 14, scale: 4 }),
  filledPrice: numeric("filled_price", { precision: 14, scale: 4 }),
  status: text("status").notNull().default("PENDING"), // PENDING | FILLED | PARTIAL | CANCELLED | REJECTED | EXPIRED
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  filledAt: timestamp("filled_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

// ── Trades ─────────────────────────────────────────────────

export const trades = pgTable("trades", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolios.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(),
  side: text("side").notNull(),
  quantity: integer("quantity").notNull(),
  executionPrice: numeric("execution_price", {
    precision: 14,
    scale: 4,
  }).notNull(),
  totalValue: numeric("total_value", { precision: 14, scale: 2 }).notNull(),
  realizedPnl: numeric("realized_pnl", { precision: 14, scale: 2 }).notNull(),
  commission: numeric("commission", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  executedAt: timestamp("executed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── News Articles ──────────────────────────────────────────

export const newsArticles = pgTable(
  "news_articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticker: text("ticker").notNull(),
    company: text("company").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    content: text("content"),
    url: text("url").notNull(),
    guid: text("guid").notNull(),
    source: text("source").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ingestedAt: timestamp("ingested_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("news_articles_guid_idx").on(table.guid)],
);

// ── Sentiment Scores ───────────────────────────────────────

export const sentimentScores = pgTable("sentiment_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id")
    .notNull()
    .references(() => newsArticles.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(),
  titleScore: integer("title_score").notNull(),
  descriptionScore: integer("description_score").notNull(),
  avgScore: integer("avg_score").notNull(),
  highestScore: integer("highest_score").notNull(),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Watchlists ─────────────────────────────────────────────

export const watchlists = pgTable("watchlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Watchlist Items ────────────────────────────────────────

export const watchlistItems = pgTable("watchlist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  watchlistId: uuid("watchlist_id")
    .notNull()
    .references(() => watchlists.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
