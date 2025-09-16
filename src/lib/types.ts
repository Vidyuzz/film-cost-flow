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

// Production Day Ops & Reports - New Types

// Enhanced ShootDay with production day details
export const ShootDayExtendedSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  date: z.string(),
  location: z.string().optional(),
  callTime: z.string().optional(), // HH:MM format
  wrapTime: z.string().optional(), // HH:MM format
  weatherNote: z.string().optional(),
  status: z.enum(['open', 'locked']).default('open'),
  notes: z.string().optional(),
  createdAt: z.string(),
});

// Schedule Items (Scenes/Shots)
export const ScheduleItemSchema = z.object({
  id: z.string(),
  shootDayId: z.string(),
  scene: z.string().min(1, "Scene is required"),
  shot: z.string().min(1, "Shot is required"),
  description: z.string().optional(),
  plannedStart: z.string().optional(), // HH:MM format
  plannedEnd: z.string().optional(), // HH:MM format
  actualStart: z.string().optional(), // HH:MM format
  actualEnd: z.string().optional(), // HH:MM format
  assignees: z.array(z.string()).default([]), // JSON array of crew member names
  status: z.enum(['planned', 'in_progress', 'done', 'dropped']).default('planned'),
  notes: z.string().optional(),
  createdAt: z.string(),
});

// Crew Management
export const CrewSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().min(1, "Crew member name is required"),
  role: z.string().min(1, "Role is required"),
  contact: z.string().optional(),
  createdAt: z.string(),
});

// Crew Feedback
export const CrewFeedbackSchema = z.object({
  id: z.string(),
  shootDayId: z.string(),
  crewId: z.string().optional(), // null for anonymous feedback
  isAnonymous: z.boolean().default(false),
  rating: z.number().min(1).max(5),
  tags: z.array(z.string()).default([]), // JSON array of tags
  notes: z.string().optional(),
  createdAt: z.string(),
});

// Props & Rentals
export const PropSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().min(1, "Prop name is required"),
  category: z.string().optional(),
  serialNo: z.string().optional(),
  ownerVendorId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
});

export const PropCheckoutSchema = z.object({
  id: z.string(),
  propId: z.string(),
  shootDayId: z.string(),
  checkedOutBy: z.string().min(1, "Checked out by is required"),
  dueReturn: z.string(), // Date string
  checkoutCondition: z.string().optional(),
  checkoutPhotoUri: z.string().optional(),
  returnedAt: z.string().optional(),
  returnCondition: z.string().optional(),
  returnPhotoUri: z.string().optional(),
  status: z.enum(['out', 'returned', 'overdue']).default('out'),
  createdAt: z.string(),
});

// Enhanced Expense with shoot day reference
export const ExpenseExtendedSchema = ExpenseSchema.extend({
  shootDayId: z.string().optional(),
  notes: z.string().optional(),
});

// Production Day Summary
export interface ProductionDaySummary {
  shootDayId: string;
  date: string;
  location: string;
  callTime: string;
  wrapTime: string;
  status: 'open' | 'locked';
  totalBudget: number;
  totalSpent: number;
  variance: number;
  variancePercent: number;
  scheduleProgress: {
    total: number;
    completed: number;
    inProgress: number;
    dropped: number;
    percentage: number;
  };
  crewFeedback: {
    totalResponses: number;
    averageRating: number;
    topIssues: string[];
  };
  propsStatus: {
    total: number;
    checkedOut: number;
    returned: number;
    overdue: number;
  };
}

// Schedule Adherence Report
export interface ScheduleAdherenceReport {
  shootDayId: string;
  date: string;
  totalShots: number;
  completedShots: number;
  droppedShots: number;
  completionPercentage: number;
  timeVariance: {
    overTime: number; // minutes
    underTime: number; // minutes
    averageDelay: number; // minutes
  };
  blockedReasons: string[];
  topDelays: Array<{
    reason: string;
    count: number;
    totalDelay: number;
  }>;
}

// Props Chain of Custody Report
export interface PropsCustodyReport {
  shootDayId: string;
  date: string;
  openCheckouts: Array<{
    propName: string;
    checkedOutBy: string;
    dueReturn: string;
    daysOverdue: number;
    condition: string;
  }>;
  overdueReturns: Array<{
    propName: string;
    checkedOutBy: string;
    dueReturn: string;
    daysOverdue: number;
  }>;
  returnedToday: Array<{
    propName: string;
    returnedBy: string;
    returnCondition: string;
    returnedAt: string;
  }>;
}

// Crew Performance Report
export interface CrewPerformanceReport {
  shootDayId: string;
  date: string;
  totalResponses: number;
  averageRating: number;
  ratingDistribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  topIssues: Array<{
    tag: string;
    count: number;
    percentage: number;
  }>;
  anonymousResponses: number;
  namedResponses: number;
}

// Export types
export type ShootDayExtended = z.infer<typeof ShootDayExtendedSchema>;
export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;
export type Crew = z.infer<typeof CrewSchema>;
export type CrewFeedback = z.infer<typeof CrewFeedbackSchema>;
export type Prop = z.infer<typeof PropSchema>;
export type PropCheckout = z.infer<typeof PropCheckoutSchema>;
export type ExpenseExtended = z.infer<typeof ExpenseExtendedSchema>;

// Form schemas for creation/editing
export const ShootDayExtendedCreateSchema = ShootDayExtendedSchema.omit({ 
  id: true, 
  createdAt: true 
});

export const ScheduleItemCreateSchema = ScheduleItemSchema.omit({ 
  id: true, 
  createdAt: true 
});

export const CrewCreateSchema = CrewSchema.omit({ 
  id: true, 
  createdAt: true 
});

export const CrewFeedbackCreateSchema = CrewFeedbackSchema.omit({ 
  id: true, 
  createdAt: true 
});

export const PropCreateSchema = PropSchema.omit({ 
  id: true, 
  createdAt: true 
});

export const PropCheckoutCreateSchema = PropCheckoutSchema.omit({ 
  id: true, 
  createdAt: true 
});

export type ShootDayExtendedCreate = z.infer<typeof ShootDayExtendedCreateSchema>;
export type ScheduleItemCreate = z.infer<typeof ScheduleItemCreateSchema>;
export type CrewCreate = z.infer<typeof CrewCreateSchema>;
export type CrewFeedbackCreate = z.infer<typeof CrewFeedbackCreateSchema>;
export type PropCreate = z.infer<typeof PropCreateSchema>;
export type PropCheckoutCreate = z.infer<typeof PropCheckoutCreateSchema>;