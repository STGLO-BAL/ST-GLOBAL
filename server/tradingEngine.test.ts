import { describe, expect, it } from "vitest";
import { calculateSettlementPayout, canApplyAdminOutcomeOverride, determineContractStatus } from "./tradingEngine";

describe("STGLOBAL trading engine", () => {
  it("settles UP and FALL trades purely by entry and closing price", () => {
    expect(determineContractStatus({ direction: "UP", entryPrice: 100, closingPrice: 101 })).toBe("won");
    expect(determineContractStatus({ direction: "UP", entryPrice: 100, closingPrice: 99 })).toBe("lost");
    expect(determineContractStatus({ direction: "FALL", entryPrice: 100, closingPrice: 99 })).toBe("won");
    expect(determineContractStatus({ direction: "FALL", entryPrice: 100, closingPrice: 101 })).toBe("lost");
    expect(determineContractStatus({ direction: "UP", entryPrice: 100, closingPrice: 100 })).toBe("draw");
  });

  it("calculates win, draw, and loss payouts with fixed decimal precision", () => {
    expect(calculateSettlementPayout({ status: "won", amount: 100, profitRate: 0.82 })).toBe("182.00000000");
    expect(calculateSettlementPayout({ status: "draw", amount: 100, profitRate: 0.82 })).toBe("100.00000000");
    expect(calculateSettlementPayout({ status: "lost", amount: 100, profitRate: 0.82 })).toBe("0.00000000");
  });

  it("allows manual outcome controls only for expired demo or simulation trades", () => {
    expect(canApplyAdminOutcomeOverride({ isDemo: true, hasReachedSettlementTime: true })).toBe(true);
    expect(canApplyAdminOutcomeOverride({ isDemo: false, hasReachedSettlementTime: true })).toBe(false);
    expect(canApplyAdminOutcomeOverride({ isDemo: true, hasReachedSettlementTime: false })).toBe(false);
  });
});
