import { storage } from './storage'
import type { 
  Project, 
  Expense, 
  Department, 
  BudgetLine,
  DailyCostReport, 
  ProjectSummary, 
  DepartmentSummary 
} from './types'

class Analytics {
  
  getDailyCostReport(projectId: string, date: string): DailyCostReport {
    const expenses = storage.getExpenses(projectId, { 
      dateFrom: date, 
      dateTo: date 
    })
    
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const expenseCount = expenses.length
    
    const departmentBreakdown = expenses.reduce((acc, expense) => {
      const dept = acc.find(d => d.departmentId === expense.departmentId)
      if (dept) {
        dept.totalSpent += expense.amount
        dept.expenseCount += 1
      } else {
        acc.push({
          departmentId: expense.departmentId,
          totalSpent: expense.amount,
          expenseCount: 1
        })
      }
      return acc
    }, [] as Array<{ departmentId: string; totalSpent: number; expenseCount: number }>)
    
    return {
      date,
      projectId,
      totalSpent,
      departmentBreakdown,
      expenses
    }
  }

  getProjectSummary(projectId: string): ProjectSummary {
    const project = storage.getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    const expenses = storage.getExpenses(projectId)
    const departments = storage.getDepartments(projectId)
    const budgetLines = storage.getBudgetLines(projectId)
    
    const totalBudget = project.totalBudget || 0
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const variance = totalBudget - totalSpent
    const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0
    
    const departmentSummaries: DepartmentSummary[] = departments.map(dept => {
      const deptExpenses = expenses.filter(e => e.departmentId === dept.id)
      const deptBudgetLines = budgetLines.filter(l => l.departmentId === dept.id)
      const deptBudget = deptBudgetLines.reduce((sum, line) => sum + line.budgetAmount, 0)
      const deptSpent = deptExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const deptVariance = deptBudget - deptSpent
      
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        budgetAmount: deptBudget,
        actualAmount: deptSpent,
        variance: deptVariance,
        variancePercent: deptBudget > 0 ? (deptVariance / deptBudget) * 100 : 0,
        percentage: 0 // placeholder
      }
    })
    
    return {
      totalBudget,
      totalSpent,
      variance,
      variancePercentage,
      departmentSummaries
    }
  }

  getTopDepartmentsBySpend(projectId: string, limit: number = 5): DepartmentSummary[] {
    const summary = this.getProjectSummary(projectId)
    return summary.departmentSummaries
      .sort((a, b) => b.actualAmount - a.actualAmount)
      .slice(0, limit)
  }

  getPaymentMethodBreakdown(projectId: string) {
    const expenses = storage.getExpenses(projectId)
    const breakdown = expenses.reduce((acc, expense) => {
      acc[expense.paymentMethod] = (acc[expense.paymentMethod] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(breakdown).map(([method, amount]) => ({
      paymentMethod: method,
      amount,
      count: expenses.filter(e => e.paymentMethod === method).length
    }))
  }

  getReimbursableExpenses(projectId: string) {
    const expenses = storage.getExpenses(projectId)
    return expenses.filter(e => e.reimbursable)
  }

  getBudgetVsActualChartData(projectId: string) {
    const summary = this.getProjectSummary(projectId)
    return summary.departmentSummaries.map(dept => ({
      name: dept.departmentName,
      budget: dept.totalBudget,
      actual: dept.totalSpent,
      variance: dept.variance
    }))
  }
}

export const analytics = new Analytics()