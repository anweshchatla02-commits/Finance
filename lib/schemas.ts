import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const customerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number is required (min 10 digits)'),
  address: z.string().min(3, 'Address must be at least 3 characters'),
  notes: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export const financeSchema = z
  .object({
    customerId: z.string().min(1, 'Please select a customer'),
    amountGiven: z.coerce.number().gt(0, 'Amount given must be greater than ₹0'),
    totalAmountToCollect: z.coerce.number().gt(0, 'Total amount to collect must be greater than ₹0'),
    dailyCollectionAmount: z.coerce.number().gt(0, 'Daily collection amount must be greater than ₹0'),
    startDate: z.string().min(1, 'Start date is required'),
    numberOfCollectionDays: z.coerce.number().optional(),
    notes: z.string().optional().nullable(),
  })
  .refine((data) => data.totalAmountToCollect >= data.amountGiven, {
    message: 'Total amount to collect cannot be less than amount given',
    path: ['totalAmountToCollect'],
  });

export const paymentSchema = z.object({
  financeId: z.string().min(1, 'Finance record is required'),
  customerId: z.string().min(1, 'Customer is required'),
  amount: z.coerce.number().gt(0, 'Payment amount must be greater than ₹0'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER']).default('CASH'),
  notes: z.string().optional().nullable(),
  allowOverpayment: z.boolean().optional().default(false),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type FinanceInputSchema = z.infer<typeof financeSchema>;
export type PaymentInputSchema = z.infer<typeof paymentSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
