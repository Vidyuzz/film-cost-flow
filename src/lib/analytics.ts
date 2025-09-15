// Analytics and reporting utilities

import { storage } from './storage';
import type { 
  ProjectSummary, 
  DepartmentSummary, 
  DailyCostReport,
  Project,
  Expense 
} from './types';

export class AnalyticsService {
  
  getProjectSummary(projectId: string): ProjectSummary {
    const project = storage.getProject(projectId);
    const departments = storage.getDepartments(projectId);
    const expenses = storage.getExpenses(projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }

    const totalBudget = project.totalBudget;
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remainingBudget = totalBudget - totalSpent;
    const variancePercent = totalBudget > 0 ? ((totalSpent - totalBudget) / totalBudget) * 100 : 0;

    const departmentSummaries: DepartmentSummary[] = departments.map(dept => {
      const deptExpenses = expenses.filter(e => e.departmentId === dept.id);
      const actualAmount = deptExpenses.reduce((sum, e) => sum + e.amount, 0);
      const variance = actualAmount - dept.budgetAmount;
      const variancePercent = dept.budgetAmount > 0 ? (variance / dept.budgetAmount) * 100 : 0;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        budgetAmount: dept.budgetAmount,
        actualAmount,
        variance,
        variancePercent,
        expenseCount: deptExpenses.length,
      };
    });

    return {
      totalBudget,
      totalSpent,
      remainingBudget,
      variancePercent,
      departmentSummaries,
      expenseCount: expenses.length,
    };
  }

  getDailyCostReport(projectId: string, date: string): DailyCostReport {
    const expenses = storage.getExpenses(projectId, { 
      dateFrom: date, 
      dateTo: date 
    });
    
    const pettyCashFloats = storage.getPettyCashFloats(projectId);
    const pettyCashTxns = pettyCashFloats.flatMap(float => 
      storage.getPettyCashTxns(float.id).filter(txn => 
        txn.date === date && txn.type === 'debit'
      )
    );

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0) +
                     pettyCashTxns.reduce((sum, txn) => sum + txn.amount, 0);

    const departments = storage.getDepartments(projectId);
    const expensesByDepartment = departments.map(dept => {
      const deptExpenses = expenses.filter(e => e.departmentId === dept.id);
      return {
        departmentName: dept.name,
        amount: deptExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: deptExpenses.length,
      };
    }).filter(dept => dept.amount > 0);

    return {
      date,
      projectId,
      totalSpent,
      expensesByDepartment,
      expenses,
      pettyCashTxns,
    };
  }

  getTopDepartmentsBySpend(projectId: string, limit: number = 3): Array<{
    departmentName: string;
    amount: number;
    percentage: number;
  }> {
    const summary = this.getProjectSummary(projectId);
    const totalSpent = summary.totalSpent;
    
    return summary.departmentSummaries
      .sort((a, b) => b.actualAmount - a.actualAmount)
      .slice(0, limit)
      .map(dept => ({
        departmentName: dept.departmentName,
        amount: dept.actualAmount,
        percentage: totalSpent > 0 ? (dept.actualAmount / totalSpent) * 100 : 0,
      }));
  }

  getExpensesByDateRange(
    projectId: string, 
    startDate: string, 
    endDate: string
  ): Array<{
    date: string;
    amount: number;
    count: number;
  }> {
    const expenses = storage.getExpenses(projectId, {
      dateFrom: startDate,
      dateTo: endDate,
    });

    const expensesByDate = expenses.reduce((acc, expense) => {
      const date = expense.date;
      if (!acc[date]) {
        acc[date] = { amount: 0, count: 0 };
      }
      acc[date].amount += expense.amount;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    return Object.entries(expensesByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  getBudgetVsActualChartData(projectId: string): Array<{
    department: string;
    budget: number;
    actual: number;
    variance: number;
  }> {
    const summary = this.getProjectSummary(projectId);
    
    return summary.departmentSummaries.map(dept => ({
      department: dept.departmentName,
      budget: dept.budgetAmount,
      actual: dept.actualAmount,
      variance: dept.variance,
    }));
  }

  getPaymentMethodBreakdown(projectId: string): Array<{
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }> {
    const expenses = storage.getExpenses(projectId);
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    const breakdown = expenses.reduce((acc, expense) => {
      const method = expense.paymentMethod;
      if (!acc[method]) {
        acc[method] = { amount: 0, count: 0 };
      }
      acc[method].amount += expense.amount;
      acc[method].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    return Object.entries(breakdown).map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    }));
  }

  getReimbursableExpenses(projectId: string): {
    total: number;
    count: number;
    expenses: Expense[];
  } {
    const expenses = storage.getExpenses(projectId);
    const reimbursableExpenses = expenses.filter(e => e.reimbursable);
    
    return {
      total: reimbursableExpenses.reduce((sum, e) => sum + e.amount, 0),
      count: reimbursableExpenses.length,
      expenses: reimbursableExpenses,
    };
  }
}

export const analytics = new AnalyticsService();