import { z } from "zod";

// Core domain types for Film Expense Tracker

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Project title is required"),
  currency: z.string().default("INR"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalBudget: z.number().min(0).default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DepartmentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().min(1, "Department name is required"),
  budgetAmount: z.number().min(0).default(0),
  createdAt: z.string(),
});

export const BudgetLineSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  departmentId: z.string(),
  lineItem: z.string().min(1, "Line item is required"),
  budgetAmount: z.number().min(0).default(0),
  createdAt: z.string(),
});

export const ShootDaySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  date: z.string(),
  location: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
});

export const VendorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Vendor name is required"),
  gstin: z.string().optional(),
  contacts: z.array(z.string()).default([]),
  createdAt: z.string(),
});

export const ExpenseSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  departmentId: z.string(),
  budgetLineId: z.string().optional(),
  vendorId: z.string().optional(),
  date: z.string(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  taxRate: z.number().min(0).max(100).default(0),
  paymentMethod: z.enum(["Cash", "UPI", "Card", "Transfer"]),
  status: z.enum(["submitted", "approved", "paid"]).default("submitted"),
  reimbursable: z.boolean().default(false),
  shootDayId: z.string().optional(),
  attachmentUri: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
});

export const PettyCashFloatSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  ownerUserId: z.string(),
  issuedAmount: z.number().min(0),
  issuedAt: z.string(),
  balance: z.number(),
  createdAt: z.string(),
});

export const PettyCashTxnSchema = z.object({
  id: z.string(),
  floatId: z.string(),
  date: z.string(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  type: z.enum(["debit", "credit"]),
  attachmentUri: z.string().optional(),
  createdAt: z.string(),
});

// Form schemas for creation/editing
export const ProjectCreateSchema = ProjectSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const ExpenseCreateSchema = ExpenseSchema.omit({ 
  id: true, 
  createdAt: true,
  createdBy: true 
});

export const PettyCashTxnCreateSchema = PettyCashTxnSchema.omit({ 
  id: true, 
  createdAt: true 
});

// Inferred types
export type Project = z.infer<typeof ProjectSchema>;
export type Department = z.infer<typeof DepartmentSchema>;
export type BudgetLine = z.infer<typeof BudgetLineSchema>;
export type ShootDay = z.infer<typeof ShootDaySchema>;
export type Vendor = z.infer<typeof VendorSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;
export type PettyCashFloat = z.infer<typeof PettyCashFloatSchema>;
export type PettyCashTxn = z.infer<typeof PettyCashTxnSchema>;

export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;
export type ExpenseCreate = z.infer<typeof ExpenseCreateSchema>;
export type PettyCashTxnCreate = z.infer<typeof PettyCashTxnCreateSchema>;

// Analytics types
export interface DepartmentSummary {
  departmentId: string;
  departmentName: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  expenseCount: number;
}

export interface ProjectSummary {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  variancePercent: number;
  departmentSummaries: DepartmentSummary[];
  expenseCount: number;
}

export interface DailyCostReport {
  date: string;
  projectId: string;
  totalSpent: number;
  expensesByDepartment: Array<{
    departmentName: string;
    amount: number;
    count: number;
  }>;
  expenses: Expense[];
  pettyCashTxns: PettyCashTxn[];
}

// CSV Import types
export interface BudgetImportRow {
  Department: string;
  LineItem: string;
  BudgetAmountINR: string;
  Notes?: string;
}

export interface ExpenseImportRow {
  Date: string;
  Department: string;
  LineItem?: string;
  Vendor?: string;
  Description: string;
  AmountINR: string;
  TaxRatePct?: string;
  PaymentMethod: string;
  PaidBy?: string;
  Reimbursable?: string;
  ShootDay?: string;
  AttachmentFileName?: string;
}