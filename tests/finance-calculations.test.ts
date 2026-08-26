import { describe, it, expect } from 'vitest';
import {
  calculateExtraProfit,
  calculateFinanceSchedule,
  calculateFinanceProgress,
} from '../lib/finance-calculations';

describe('Finance Business Logic & Calculations', () => {
  it('should calculate profit/extra amount correctly (₹24,000 - ₹20,000 = ₹4,000)', () => {
    const profit = calculateExtraProfit(20000, 24000);
    expect(profit).toBe(4000);
  });

  it('should generate exact 80-day schedule for ₹20,000 given, ₹24,000 total, ₹300 daily', () => {
    const result = calculateFinanceSchedule({
      amountGiven: 20000,
      totalAmountToCollect: 24000,
      dailyCollectionAmount: 300,
      startDate: new Date('2026-08-25'),
    });

    expect(result.amountGiven).toBe(20000);
    expect(result.totalAmountToCollect).toBe(24000);
    expect(result.dailyCollectionAmount).toBe(300);
    expect(result.extraProfitAmount).toBe(4000);
    expect(result.totalDays).toBe(80);
    expect(result.fullDays).toBe(80);
    expect(result.finalPaymentAmount).toBe(300);
    expect(result.schedule.length).toBe(80);

    // Verify first and last payments
    expect(result.schedule[0].expectedAmount).toBe(300);
    expect(result.schedule[79].expectedAmount).toBe(300);
    expect(result.schedule[79].isFinalPayment).toBe(false);
  });

  it('should handle non-exact division correctly with auto-adjusted final payment (₹10,000 total / ₹300 daily)', () => {
    const result = calculateFinanceSchedule({
      amountGiven: 8000,
      totalAmountToCollect: 10000,
      dailyCollectionAmount: 300,
      startDate: new Date('2026-08-25'),
    });

    // 10,000 / 300 = 33 full days of ₹300 + 1 final day of ₹100 (Total 34 days)
    expect(result.fullDays).toBe(33);
    expect(result.totalDays).toBe(34);
    expect(result.finalPaymentAmount).toBe(100);
    expect(result.schedule.length).toBe(34);

    // Check last day payment is ₹100
    expect(result.schedule[33].expectedAmount).toBe(100);
    expect(result.schedule[33].isFinalPayment).toBe(true);
  });

  it('should detect schedule mismatch and provide warning', () => {
    const result = calculateFinanceSchedule({
      amountGiven: 20000,
      totalAmountToCollect: 24000,
      dailyCollectionAmount: 300,
      startDate: new Date('2026-08-25'),
      numberOfCollectionDays: 75, // Mismatch (expected 80)
    });

    expect(result.mismatchWarning).toBeDefined();
    expect(result.mismatchWarning).toContain('Schedule mismatch');
  });

  it('should calculate collection progress and remaining balance accurately', () => {
    const progress = calculateFinanceProgress(24000, 6000);
    expect(progress.totalCollected).toBe(6000);
    expect(progress.remainingAmount).toBe(18000);
    expect(progress.progressPercentage).toBe(25);
    expect(progress.isCompleted).toBe(false);

    const completedProgress = calculateFinanceProgress(24000, 24000);
    expect(completedProgress.remainingAmount).toBe(0);
    expect(completedProgress.progressPercentage).toBe(100);
    expect(completedProgress.isCompleted).toBe(true);
  });

  it('should throw validation error when amount given > total amount to collect', () => {
    expect(() =>
      calculateFinanceSchedule({
        amountGiven: 25000,
        totalAmountToCollect: 20000,
        dailyCollectionAmount: 300,
        startDate: new Date('2026-08-25'),
      })
    ).toThrow('Total amount to collect cannot be less than amount given');
  });
});
