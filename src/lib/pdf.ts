// PDF generation utilities using jsPDF

import jsPDF from 'jspdf';
import { analytics } from './analytics';
import { storage } from './storage';
import type { DailyCostReport, ProjectSummary } from './types';

export class PDFService {
  
  // Generate Daily Cost Report PDF
  generateDailyCostReport(projectId: string, date: string): Blob {
    const dcr = analytics.getDailyCostReport(projectId, date);
    const project = storage.getProject(projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, options?: any) => {
      doc.text(text, x, y, options);
      return y + 7; // Return next line position
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    addText('DAILY COST REPORT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Project and date info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(`Project: ${project.title}`, 20, yPosition);
    yPosition = addText(`Date: ${new Date(date).toLocaleDateString()}`, 20, yPosition);
    yPosition = addText(`Currency: ${project.currency}`, 20, yPosition);
    yPosition += 10;

    // Summary section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('SUMMARY', 20, yPosition);
    yPosition += 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(`Total Spent Today: ${project.currency} ${dcr.totalSpent.toLocaleString()}`, 20, yPosition);
    yPosition = addText(`Number of Expenses: ${dcr.expenses.length}`, 20, yPosition);
    yPosition = addText(`Petty Cash Transactions: ${dcr.pettyCashTxns.length}`, 20, yPosition);
    yPosition += 10;

    // Department breakdown
    if (dcr.expensesByDepartment.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('DEPARTMENT BREAKDOWN', 20, yPosition);
      yPosition += 5;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Table headers
      const headers = ['Department', 'Amount', 'Count'];
      let xPos = 20;
      headers.forEach((header, index) => {
        doc.setFont('helvetica', 'bold');
        doc.text(header, xPos, yPosition);
        xPos += index === 0 ? 80 : 40;
      });
      yPosition += 7;

      // Table data
      dcr.expensesByDepartment.forEach(dept => {
        xPos = 20;
        doc.setFont('helvetica', 'normal');
        doc.text(dept.departmentName, xPos, yPosition);
        xPos += 80;
        doc.text(`${project.currency} ${dept.amount.toLocaleString()}`, xPos, yPosition);
        xPos += 40;
        doc.text(dept.count.toString(), xPos, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Expenses detail
    if (dcr.expenses.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('EXPENSE DETAILS', 20, yPosition);
      yPosition += 5;

      doc.setFontSize(9);
      
      dcr.expenses.forEach(expense => {
        if (yPosition > 270) { // Start new page if needed
          doc.addPage();
          yPosition = 20;
        }

        const departments = storage.getDepartments(projectId);
        const vendors = storage.getVendors();
        
        const department = departments.find(d => d.id === expense.departmentId)?.name || 'Unknown';
        const vendor = expense.vendorId ? vendors.find(v => v.id === expense.vendorId)?.name || 'Unknown' : '';

        doc.setFont('helvetica', 'bold');
        yPosition = addText(`${expense.description}`, 20, yPosition);
        
        doc.setFont('helvetica', 'normal');
        yPosition = addText(`Department: ${department} | Amount: ${project.currency} ${expense.amount.toLocaleString()} | Method: ${expense.paymentMethod}`, 25, yPosition);
        
        if (vendor) {
          yPosition = addText(`Vendor: ${vendor}`, 25, yPosition);
        }
        
        if (expense.reimbursable) {
          yPosition = addText(`Reimbursable: Yes`, 25, yPosition);
        }
        
        yPosition += 5;
      });
    }

    // Footer
    yPosition = Math.max(yPosition + 20, 280);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date().toLocaleString()}`, 20, yPosition);
    doc.text(`Film Expense Tracker`, pageWidth - 20, yPosition, { align: 'right' });

    return doc.output('blob');
  }

  // Generate Project Wrap Report PDF
  generateWrapReport(projectId: string): Blob {
    const summary = analytics.getProjectSummary(projectId);
    const project = storage.getProject(projectId);
    const paymentBreakdown = analytics.getPaymentMethodBreakdown(projectId);
    const reimbursableExpenses = analytics.getReimbursableExpenses(projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Helper function
    const addText = (text: string, x: number, y: number, options?: any) => {
      doc.text(text, x, y, options);
      return y + 7;
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    addText('PROJECT WRAP REPORT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Project info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(`Project: ${project.title}`, 20, yPosition);
    yPosition = addText(`Period: ${project.startDate || 'N/A'} to ${project.endDate || 'N/A'}`, 20, yPosition);
    yPosition = addText(`Currency: ${project.currency}`, 20, yPosition);
    yPosition += 10;

    // Financial Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('FINANCIAL SUMMARY', 20, yPosition);
    yPosition += 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(`Total Budget: ${project.currency} ${summary.totalBudget.toLocaleString()}`, 20, yPosition);
    yPosition = addText(`Total Spent: ${project.currency} ${summary.totalSpent.toLocaleString()}`, 20, yPosition);
    yPosition = addText(`Remaining Budget: ${project.currency} ${summary.remainingBudget.toLocaleString()}`, 20, yPosition);
    
    const varianceText = summary.variancePercent >= 0 
      ? `Over Budget: ${summary.variancePercent.toFixed(1)}%`
      : `Under Budget: ${Math.abs(summary.variancePercent).toFixed(1)}%`;
    yPosition = addText(varianceText, 20, yPosition);
    yPosition = addText(`Total Expenses: ${summary.expenseCount}`, 20, yPosition);
    yPosition += 10;

    // Department breakdown
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('DEPARTMENT ANALYSIS', 20, yPosition);
    yPosition += 5;

    doc.setFontSize(10);
    
    // Table headers
    const headers = ['Department', 'Budget', 'Actual', 'Variance', '%'];
    let xPos = 20;
    const colWidths = [60, 35, 35, 35, 25];
    
    headers.forEach((header, index) => {
      doc.setFont('helvetica', 'bold');
      doc.text(header, xPos, yPosition);
      xPos += colWidths[index];
    });
    yPosition += 7;

    // Table data
    summary.departmentSummaries.forEach(dept => {
      xPos = 20;
      doc.setFont('helvetica', 'normal');
      
      // Truncate long department names
      const deptName = dept.departmentName.length > 15 
        ? dept.departmentName.substring(0, 12) + '...'
        : dept.departmentName;
      
      doc.text(deptName, xPos, yPosition);
      xPos += colWidths[0];
      doc.text(`${dept.budgetAmount.toLocaleString()}`, xPos, yPosition);
      xPos += colWidths[1];
      doc.text(`${dept.actualAmount.toLocaleString()}`, xPos, yPosition);
      xPos += colWidths[2];
      doc.text(`${dept.variance >= 0 ? '+' : ''}${dept.variance.toLocaleString()}`, xPos, yPosition);
      xPos += colWidths[3];
      doc.text(`${dept.variancePercent >= 0 ? '+' : ''}${dept.variancePercent.toFixed(1)}%`, xPos, yPosition);
      
      yPosition += 6;
    });
    yPosition += 10;

    // Payment method breakdown
    if (paymentBreakdown.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('PAYMENT METHODS', 20, yPosition);
      yPosition += 5;

      doc.setFontSize(10);
      const totalAmount = paymentBreakdown.reduce((sum, p) => sum + p.amount, 0)
      paymentBreakdown.forEach(payment => {
        const percentage = totalAmount > 0 ? (payment.amount / totalAmount) * 100 : 0
        doc.setFont('helvetica', 'normal');
        yPosition = addText(
          `${payment.paymentMethod}: ${project.currency} ${payment.amount.toLocaleString()} (${percentage.toFixed(1)}%)`, 
          20, 
          yPosition
        );
      });
      yPosition += 10;
    }

    // Reimbursable expenses
    if (reimbursableExpenses.length > 0) {
      const totalReimbursable = reimbursableExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('REIMBURSABLE EXPENSES', 20, yPosition);
      yPosition += 5;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      yPosition = addText(`Total Reimbursable: ${project.currency} ${totalReimbursable.toLocaleString()}`, 20, yPosition);
      yPosition = addText(`Number of Items: ${reimbursableExpenses.length}`, 20, yPosition);
    }

    // Footer
    yPosition = Math.max(yPosition + 20, 280);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date().toLocaleString()}`, 20, yPosition);
    doc.text(`Film Expense Tracker`, pageWidth - 20, yPosition, { align: 'right' });

    return doc.output('blob');
  }

  // Download PDF
  downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const pdfService = new PDFService();