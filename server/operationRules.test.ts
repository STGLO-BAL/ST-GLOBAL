import { describe, expect, it } from "vitest";
import { assertReviewableTransaction, assertTransferAllowed, calculateSpotOrder } from "./operationRules";

describe("STGLOBAL wallet and admin operation rules", () => {
  it("rejects self-transfers and non-positive transfer amounts", () => {
    expect(() => assertTransferAllowed({ userId: 7, targetUserId: 7, amount: "10" })).toThrow("same account");
    expect(() => assertTransferAllowed({ userId: 7, targetUserId: 8, amount: "0" })).toThrow("greater than zero");
    expect(assertTransferAllowed({ userId: 7, targetUserId: 8, amount: "12.5" })).toBe(12.5);
  });

  it("calculates spot buy and sell notional values consistently", () => {
    expect(calculateSpotOrder({ side: "buy", amount: "0.01", price: "50000" })).toMatchObject({ usdtValue: 500, debitAsset: "USDT", creditAsset: "BASE" });
    expect(calculateSpotOrder({ side: "sell", amount: "0.02", price: "3000" })).toMatchObject({ usdtValue: 60, debitAsset: "BASE", creditAsset: "USDT" });
    expect(() => calculateSpotOrder({ side: "buy", amount: "0", price: "50000" })).toThrow("greater than zero");
  });

  it("only allows pending transactions to be approved or rejected", () => {
    expect(assertReviewableTransaction({ currentStatus: "pending", nextStatus: "approved" })).toBe("approved");
    expect(() => assertReviewableTransaction({ currentStatus: "completed", nextStatus: "rejected" })).toThrow("Only pending transactions");
  });
});
