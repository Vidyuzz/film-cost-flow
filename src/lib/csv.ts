// CSV import/export utilities using papaparse

import Papa from 'papaparse';
import { storage } from './storage';
import type { 
  BudgetImportRow, 
  ExpenseImportRow,
  Expense,
  DepartmentSummary 
} from './types';

export interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
}

export class CSVService {
  
  // Budget import
  async importBudgetCSV(projectId: string, file: File): Promise<ImportResult> {
    return new Promise((resolve) => {
      Papa.parse<BudgetImportRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const errors: string[] = [];
          let imported = 0;

          // Get or create departments
          const departments = storage.getDepartments(projectId);
          const departmentMap = new Map(departments.map(d => [d.name.toLowerCase(), d]));

          results.data.forEach((row, index) => {
            try {
              const deptName = row.Department?.trim();
              const lineItem = row.LineItem?.trim();
              const budgetAmount = parseFloat(row.BudgetAmountINR?.replace(/[^0-9.-]/g, '') || '0');

              if (!deptName || !lineItem || isNaN(budgetAmount)) {
                errors.push(`Row ${index + 2}: Missing required fields (Department, LineItem, BudgetAmountINR)`);
                return;
              }

              // Find or create department
              let department = departmentMap.get(deptName.toLowerCase());
              if (!department) {
                department = storage.addDepartment({
                  projectId,
                  name: deptName,
                  budgetAmount: 0,
                });
                departmentMap.set(deptName.toLowerCase(), department);
              }

              // Add budget line
              storage.addBudgetLine({
                projectId,
                departmentId: department.id,
                lineItem,
                budgetAmount,
              });

              imported++;
            } catch (error) {
              errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          });

          resolve({
            success: errors.length === 0,
            message: imported > 0 
              ? `Successfully imported ${imported} budget line(s)${errors.length > 0 ? ` with ${errors.length} error(s)` : ''}` 
              : 'No budget lines imported',
            imported,
            errors,
          });
        },
        error: (error) => {
          resolve({
            success: false,
            message: `CSV parsing error: ${error.message}`,
            imported: 0,
            errors: [error.message],
          });
        }
      });
    });
  }

  // Expense import
  async importExpenseCSV(projectId: string, file: File): Promise<ImportResult> {
    return new Promise((resolve) => {
      Papa.parse<ExpenseImportRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const errors: string[] = [];
          let imported = 0;

          // Get reference data
          const departments = storage.getDepartments(projectId);
          const budgetLines = storage.getBudgetLines(projectId);
          const vendors = storage.getVendors();
          const shootDays = storage.getShootDays(projectId);

          const departmentMap = new Map(departments.map(d => [d.name.toLowerCase(), d]));
          const budgetLineMap = new Map(budgetLines.map(bl => [bl.lineItem.toLowerCase(), bl]));
          const vendorMap = new Map(vendors.map(v => [v.name.toLowerCase(), v]));
          const shootDayMap = new Map(shootDays.map(sd => [sd.date, sd]));

          results.data.forEach((row, index) => {
            try {
              const date = row.Date?.trim();
              const deptName = row.Department?.trim();
              const description = row.Description?.trim();
              const amount = parseFloat(row.AmountINR?.replace(/[^0-9.-]/g, '') || '0');
              const paymentMethod = row.PaymentMethod?.trim() as 'Cash' | 'UPI' | 'Card' | 'Transfer';

              // Validation
              if (!date || !deptName || !description || isNaN(amount) || amount <= 0) {
                errors.push(`Row ${index + 2}: Missing required fields (Date, Department, Description, AmountINR)`);
                return;
              }

              if (!['Cash', 'UPI', 'Card', 'Transfer'].includes(paymentMethod)) {
                errors.push(`Row ${index + 2}: Invalid payment method. Must be Cash, UPI, Card, or Transfer`);
                return;
              }

              // Find department
              const department = departmentMap.get(deptName.toLowerCase());
              if (!department) {
                errors.push(`Row ${index + 2}: Department "${deptName}" not found`);
                return;
              }

              // Optional fields
              const budgetLine = row.LineItem ? budgetLineMap.get(row.LineItem.toLowerCase()) : undefined;
              const vendor = row.Vendor ? vendorMap.get(row.Vendor.toLowerCase()) : undefined;
              const shootDay = row.ShootDay ? shootDayMap.get(row.ShootDay) : undefined;
              const taxRate = parseFloat(row.TaxRatePct || '0');
              const reimbursable = row.Reimbursable?.toLowerCase() === 'y' || row.Reimbursable?.toLowerCase() === 'yes';

              // Add expense
              storage.addExpense({
                projectId,
                departmentId: department.id,
                budgetLineId: budgetLine?.id,
                vendorId: vendor?.id,
                date,
                description,
                amount,
                taxRate: isNaN(taxRate) ? 0 : taxRate,
                paymentMethod,
                status: 'submitted',
                reimbursable,
                shootDayId: shootDay?.id,
              });

              imported++;
            } catch (error) {
              errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          });

          resolve({
            success: errors.length === 0,
            message: imported > 0 
              ? `Successfully imported ${imported} expense(s)${errors.length > 0 ? ` with ${errors.length} error(s)` : ''}` 
              : 'No expenses imported',
            imported,
            errors,
          });
        },
        error: (error) => {
          resolve({
            success: false,
            message: `CSV parsing error: ${error.message}`,
            imported: 0,
            errors: [error.message],
          });
        }
      });
    });
  }

  // Export expenses to CSV
  exportExpensesCSV(projectId: string, filters?: {
    dateFrom?: string;
    dateTo?: string;
    departmentId?: string;
  }): string {
    const expenses = storage.getExpenses(projectId, filters);
    const departments = storage.getDepartments(projectId);
    const budgetLines = storage.getBudgetLines(projectId);
    const vendors = storage.getVendors();
    const shootDays = storage.getShootDays(projectId);

    const departmentMap = new Map(departments.map(d => [d.id, d.name]));
    const budgetLineMap = new Map(budgetLines.map(bl => [bl.id, bl.lineItem]));
    const vendorMap = new Map(vendors.map(v => [v.id, v.name]));
    const shootDayMap = new Map(shootDays.map(sd => [sd.id, sd.date]));

    const csvData = expenses.map(expense => ({
      Date: expense.date,
      Department: departmentMap.get(expense.departmentId) || '',
      LineItem: expense.budgetLineId ? budgetLineMap.get(expense.budgetLineId) || '' : '',
      Vendor: expense.vendorId ? vendorMap.get(expense.vendorId) || '' : '',
      Description: expense.description,
      AmountINR: expense.amount.toFixed(2),
      TaxRatePct: expense.taxRate.toFixed(2),
      PaymentMethod: expense.paymentMethod,
      Status: expense.status,
      Reimbursable: expense.reimbursable ? 'Y' : 'N',
      ShootDay: expense.shootDayId ? shootDayMap.get(expense.shootDayId) || '' : '',
      CreatedBy: expense.createdBy,
      CreatedAt: expense.createdAt,
    }));

    return Papa.unparse(csvData);
  }

  // Export budget vs actual to CSV
  exportBudgetVsActualCSV(projectId: string, departmentSummaries: DepartmentSummary[]): string {
    const csvData = departmentSummaries.map(dept => ({
      Department: dept.departmentName,
      BudgetAmountINR: dept.budgetAmount.toFixed(2),
      ActualAmountINR: dept.actualAmount.toFixed(2),
      VarianceINR: dept.variance.toFixed(2),
      VariancePercent: dept.variancePercent.toFixed(2),
      ExpenseCount: dept.expenseCount,
    }));

    return Papa.unparse(csvData);
  }

  // Download CSV file
  downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Generate sample CSV templates
  getBudgetImportTemplate(): string {
    const sampleData = [
      {
        Department: 'Pre-Production',
        LineItem: 'Script Development',
        BudgetAmountINR: '25000',
        Notes: 'Writer fees and script revisions'
      },
      {
        Department: 'Production',
        LineItem: 'Equipment Rental',
        BudgetAmountINR: '120000',
        Notes: 'Camera, lighting, sound equipment'
      },
      {
        Department: 'Post-Production',
        LineItem: 'Editing',
        BudgetAmountINR: '50000',
        Notes: 'Video editing and post-production'
      }
    ];

    return Papa.unparse(sampleData);
  }

  getExpenseImportTemplate(): string {
    const sampleData = [
      {
        Date: '2024-01-15',
        Department: 'Production',
        LineItem: 'Equipment Rental',
        Vendor: 'Camera House Mumbai',
        Description: 'Camera equipment rental - Day 1',
        AmountINR: '15000',
        TaxRatePct: '18',
        PaymentMethod: 'Transfer',
        PaidBy: 'Producer',
        Reimbursable: 'N',
        ShootDay: '2024-01-15',
        AttachmentFileName: 'receipt_001.jpg'
      },
      {
        Date: '2024-01-15',
        Department: 'Production',
        LineItem: 'Catering',
        Vendor: 'Catering Express',
        Description: 'Lunch catering for crew',
        AmountINR: '3500',
        TaxRatePct: '5',
        PaymentMethod: 'Cash',
        PaidBy: 'Assistant Director',
        Reimbursable: 'Y',
        ShootDay: '2024-01-15',
        AttachmentFileName: ''
      }
    ];

    return Papa.unparse(sampleData);
  }
}

export const csvService = new CSVService();