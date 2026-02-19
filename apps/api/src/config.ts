import "dotenv/config";

export const config = {
  // Server
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",

  // Database
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://trading:trading_local@localhost:5432/trading_sim",

  // Auth
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Price Service
  yahooFinanceBaseUrl:
    process.env.YAHOO_FINANCE_BASE_URL || "https://query2.finance.yahoo.com",
  priceCacheTtlSeconds: parseInt(
    process.env.PRICE_CACHE_TTL_SECONDS || "60",
    10,
  ),

  // Trading Engine
  slippageBps: parseInt(process.env.SLIPPAGE_BPS || "5", 10),
  commission: parseFloat(process.env.COMMISSION || "0"),
  enforceMarketHours: process.env.ENFORCE_MARKET_HOURS !== "false",
} as const;
