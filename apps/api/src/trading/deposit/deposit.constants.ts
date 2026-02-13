export const DEPOSIT_AMOUNTS = [10_000_000, 30_000_000, 50_000_000, 100_000_000] as const;
export type DepositAmount = (typeof DEPOSIT_AMOUNTS)[number];

export const DEPOSIT_LIMIT_PER_MONTH = 3; // 한달에 3번까지
