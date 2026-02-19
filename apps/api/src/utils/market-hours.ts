/**
 * Check if the current time falls within US market hours.
 * Market hours: Monday–Friday, 9:30 AM – 4:00 PM Eastern Time.
 */
export function isMarketOpen(now: Date = new Date()): boolean {
  // Convert to Eastern Time
  const eastern = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" }),
  );

  const day = eastern.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false;

  const hours = eastern.getHours();
  const minutes = eastern.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM

  return timeInMinutes >= marketOpen && timeInMinutes < marketClose;
}

/**
 * Apply simulated slippage to a price.
 * BUY orders slip up, SELL orders slip down.
 */
export function applySlippage(
  price: number,
  side: "BUY" | "SELL" | "SHORT" | "COVER",
  slippageBps: number,
): number {
  const slipsUp = side === "BUY" || side === "COVER";
  const multiplier = slipsUp
    ? 1 + slippageBps / 10_000
    : 1 - slippageBps / 10_000;
  return +(price * multiplier).toFixed(4);
}
