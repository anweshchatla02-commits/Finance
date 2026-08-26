import Decimal from 'decimal.js';

export interface FinanceInput {
  amountGiven: number | string | Decimal;
  totalAmountToCollect: number | string | Decimal;
  dailyCollectionAmount: number | string | Decimal;
  startDate: Date | string;
  numberOfCollectionDays?: number;
}

export interface GeneratedScheduleItem {
  dayNumber: number;
  scheduledDate: Date;
  expectedAmount: number;
  formattedDate: string;
  isFinalPayment: boolean;
}

export interface ScheduleCalculationResult {
  amountGiven: number;
  totalAmountToCollect: number;
  dailyCollectionAmount: number;
  extraProfitAmount: number;
  totalDays: number;
  fullDays: number;
  finalPaymentAmount: number;
  startDate: Date;
  endDate: Date;
  schedule: GeneratedScheduleItem[];
  mismatchWarning?: string;
}

/**
 * Calculates extra/profit amount: Total To Collect - Amount Given
 */
export function calculateExtraProfit(
  amountGiven: number | string | Decimal,
  totalAmountToCollect: number | string | Decimal
): number {
  const given = new Decimal(amountGiven || 0);
  const total = new Decimal(totalAmountToCollect || 0);
  const profit = total.minus(given);
  return profit.isNegative() ? 0 : profit.toNumber();
}

/**
 * Generates exact repayment schedule handling exact division and remainder adjustments
 */
export function calculateFinanceSchedule(
  input: FinanceInput
): ScheduleCalculationResult {
  const amountGiven = new Decimal(input.amountGiven || 0);
  const totalAmountToCollect = new Decimal(input.totalAmountToCollect || 0);
  const dailyAmount = new Decimal(input.dailyCollectionAmount || 0);

  if (amountGiven.lte(0)) {
    throw new Error('Amount given must be greater than 0');
  }
  if (totalAmountToCollect.lt(amountGiven)) {
    throw new Error('Total amount to collect cannot be less than amount given');
  }
  if (dailyAmount.lte(0)) {
    throw new Error('Daily collection amount must be greater than 0');
  }

  const extraProfitAmount = totalAmountToCollect.minus(amountGiven).toNumber();
  const start = new Date(input.startDate);

  // Full days calculation
  const fullDays = totalAmountToCollect.dividedBy(dailyAmount).floor().toNumber();
  const remainder = totalAmountToCollect.mod(dailyAmount).toNumber();

  const totalDays = remainder > 0 ? fullDays + 1 : fullDays;
  const finalPaymentAmount = remainder > 0 ? remainder : dailyAmount.toNumber();

  const schedule: GeneratedScheduleItem[] = [];

  for (let i = 0; i < totalDays; i++) {
    const scheduledDate = new Date(start);
    scheduledDate.setDate(start.getDate() + i);

    const isFinal = i === totalDays - 1 && remainder > 0;
    const expectedAmount = isFinal ? remainder : dailyAmount.toNumber();

    const formattedDate = scheduledDate.toISOString().split('T')[0];

    schedule.push({
      dayNumber: i + 1,
      scheduledDate,
      expectedAmount,
      formattedDate,
      isFinalPayment: isFinal,
    });
  }

  const endDate = schedule.length > 0 ? schedule[schedule.length - 1].scheduledDate : start;

  let mismatchWarning: string | undefined = undefined;

  if (input.numberOfCollectionDays && input.numberOfCollectionDays !== totalDays) {
    const userDays = input.numberOfCollectionDays;
    const userTotal = dailyAmount.times(userDays).toNumber();
    mismatchWarning = `Schedule mismatch: ${userDays} days × ₹${dailyAmount.toString()} = ₹${userTotal}. Total collection agreed is ₹${totalAmountToCollect.toString()}. Auto-adjusted to ${totalDays} total payments (${fullDays} × ₹${dailyAmount.toString()}${remainder > 0 ? ` + 1 final payment of ₹${remainder}` : ''}).`;
  }

  return {
    amountGiven: amountGiven.toNumber(),
    totalAmountToCollect: totalAmountToCollect.toNumber(),
    dailyCollectionAmount: dailyAmount.toNumber(),
    extraProfitAmount,
    totalDays,
    fullDays,
    finalPaymentAmount,
    startDate: start,
    endDate,
    schedule,
    mismatchWarning,
  };
}

/**
 * Calculates current progress of a finance record based on paid amount
 */
export function calculateFinanceProgress(
  totalAmountToCollect: number | string | Decimal,
  totalCollectedAmount: number | string | Decimal
) {
  const total = new Decimal(totalAmountToCollect || 0);
  const collected = new Decimal(totalCollectedAmount || 0);

  const remaining = Decimal.max(0, total.minus(collected)).toNumber();
  const percentage = total.gt(0)
    ? Decimal.min(100, collected.dividedBy(total).times(100)).toDecimalPlaces(1).toNumber()
    : 0;

  const isCompleted = collected.gte(total);

  return {
    totalCollected: collected.toNumber(),
    remainingAmount: remaining,
    progressPercentage: percentage,
    isCompleted,
  };
}
