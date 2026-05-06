export function assertPositiveAmount(value: string, label = "Amount") {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(`${label} must be greater than zero`);
  return amount;
}

export function assertTransferAllowed(input: { userId: number; targetUserId: number; amount: string }) {
  if (input.userId === input.targetUserId) throw new Error("Cannot transfer to the same account");
  return assertPositiveAmount(input.amount, "Transfer amount");
}

export function calculateSpotOrder(input: { side: "buy" | "sell"; amount: string; price: string }) {
  const amount = assertPositiveAmount(input.amount, "Spot amount");
  const price = assertPositiveAmount(input.price, "Spot price");
  return {
    amount,
    price,
    usdtValue: amount * price,
    debitAsset: input.side === "buy" ? "USDT" : "BASE",
    creditAsset: input.side === "buy" ? "BASE" : "USDT",
  } as const;
}

export function assertReviewableTransaction(input: { currentStatus: string; nextStatus: "approved" | "rejected" }) {
  if (input.currentStatus !== "pending") throw new Error("Only pending transactions can be reviewed");
  return input.nextStatus;
}
