export type TradeDirection = "UP" | "FALL";
export type TradeStatus = "won" | "lost" | "draw";

export function determineContractStatus(input: { direction: TradeDirection; entryPrice: number; closingPrice: number }): TradeStatus {
  if (!Number.isFinite(input.entryPrice) || !Number.isFinite(input.closingPrice)) {
    throw new Error("Prices must be finite numbers");
  }
  if (input.closingPrice === input.entryPrice) return "draw";
  if (input.direction === "UP") return input.closingPrice > input.entryPrice ? "won" : "lost";
  return input.closingPrice < input.entryPrice ? "won" : "lost";
}

export function calculateSettlementPayout(input: { status: TradeStatus; amount: number; profitRate: number }): string {
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Amount must be greater than zero");
  if (!Number.isFinite(input.profitRate) || input.profitRate < 0) throw new Error("Profit rate must be non-negative");
  if (input.status === "lost") return "0.00000000";
  if (input.status === "draw") return input.amount.toFixed(8);
  return (input.amount * (1 + input.profitRate)).toFixed(8);
}

export function canApplyAdminOutcomeOverride(input: { isDemo: boolean; hasReachedSettlementTime: boolean }) {
  return input.isDemo && input.hasReachedSettlementTime;
}
