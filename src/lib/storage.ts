// Local storage utilities for offline-first functionality

import type { 
  Project, 
  Department, 
  BudgetLine, 
  ShootDay, 
  Vendor, 
  Expense, 
  PettyCashFloat, 
  PettyCashTxn 
} from './types';

const STORAGE_VERSION = '1.0';
const STORAGE_PREFIX = 'film_expense_tracker_';

// Storage keys
const KEYS = {
  projects: 'projects',
  departments: 'departments',
  budgetLines: 'budget_lines',
  shootDays: 'shoot_days',
  vendors: 'vendors',
  expenses: 'expenses',
  pettyCashFloats: 'petty_cash_floats',
  pettyCashTxns: 'petty_cash_txns',
  version: 'version',
  currentProject: 'current_project',
} as const;

// Utility functions
const getStorageKey = (key: string): string => `${STORAGE_PREFIX}${key}`;

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// Generic storage operations
class StorageManager {
  private getItem<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(getStorageKey(key));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return [];
    }
  }

  private setItem<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(getStorageKey(key), JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
    }
  }

  // Project operations
  getProjects(): Project[] {
    return this.getItem<Project>(KEYS.projects);
  }

  addProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const projects = this.getProjects();
    const newProject: Project = {
      ...projectData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    
    projects.push(newProject);
    this.setItem(KEYS.projects, projects);
    return newProject;
  }

  updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Project | null {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    projects[index] = { 
      ...projects[index], 
      ...updates, 
      updatedAt: getCurrentTimestamp() 
    };
    this.setItem(KEYS.projects, projects);
    return projects[index];
  }

  getProject(id: string): Project | null {
    const projects = this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  // Department operations
  getDepartments(projectId?: string): Department[] {
    const departments = this.getItem<Department>(KEYS.departments);
    return projectId 
      ? departments.filter(d => d.projectId === projectId)
      : departments;
  }

  addDepartment(deptData: Omit<Department, 'id' | 'createdAt'>): Department {
    const departments = this.getDepartments();
    const newDepartment: Department = {
      ...deptData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    };
    
    departments.push(newDepartment);
    this.setItem(KEYS.departments, departments);
    return newDepartment;
  }

  updateDepartment(id: string, updates: Partial<Omit<Department, 'id' | 'createdAt'>>): Department | null {
    const departments = this.getDepartments();
    const index = departments.findIndex(d => d.id === id);
    
    if (index === -1) return null;
    
    departments[index] = { ...departments[index], ...updates };
    this.setItem(KEYS.departments, departments);
    return departments[index];
  }

  // Budget line operations
  getBudgetLines(projectId?: string, departmentId?: string): BudgetLine[] {
    let lines = this.getItem<BudgetLine>(KEYS.budgetLines);
    
    if (projectId) {
      lines = lines.filter(l => l.projectId === projectId);
    }
    if (departmentId) {
      lines = lines.filter(l => l.departmentId === departmentId);
    }
    
    return lines;
  }

  addBudgetLine(lineData: Omit<BudgetLine, 'id' | 'createdAt'>): BudgetLine {
    const lines = this.getBudgetLines();
    const newLine: BudgetLine = {
      ...lineData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    };
    
    lines.push(newLine);
    this.setItem(KEYS.budgetLines, lines);
    return newLine;
  }

  updateBudgetLine(id: string, updates: Partial<Omit<BudgetLine, 'id' | 'createdAt'>>): BudgetLine | null {
    const lines = this.getBudgetLines();
    const index = lines.findIndex(l => l.id === id);
    
    if (index === -1) return null;
    
    lines[index] = { ...lines[index], ...updates };
    this.setItem(KEYS.budgetLines, lines);
    return lines[index];
  }

  // Expense operations
  getExpenses(projectId?: string, filters?: {
    departmentId?: string;
    dateFrom?: string;
    dateTo?: string;
    shootDayId?: string;
    status?: string;
    paymentMethod?: string;
  }): Expense[] {
    let expenses = this.getItem<Expense>(KEYS.expenses);
    
    if (projectId) {
      expenses = expenses.filter(e => e.projectId === projectId);
    }

    if (filters) {
      if (filters.departmentId) {
        expenses = expenses.filter(e => e.departmentId === filters.departmentId);
      }
      if (filters.dateFrom) {
        expenses = expenses.filter(e => e.date >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        expenses = expenses.filter(e => e.date <= filters.dateTo!);
      }
      if (filters.shootDayId) {
        expenses = expenses.filter(e => e.shootDayId === filters.shootDayId);
      }
      if (filters.status) {
        expenses = expenses.filter(e => e.status === filters.status);
      }
      if (filters.paymentMethod) {
        expenses = expenses.filter(e => e.paymentMethod === filters.paymentMethod);
      }
    }

    return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addExpense(expenseData: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>): Expense {
    const expenses = this.getExpenses();
    const newExpense: Expense = {
      ...expenseData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
      createdBy: 'user',
    };
    
    expenses.push(newExpense);
    this.setItem(KEYS.expenses, expenses);
    return newExpense;
  }

  updateExpense(id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt' | 'createdBy'>>): Expense | null {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    
    if (index === -1) return null;
    
    expenses[index] = { ...expenses[index], ...updates };
    this.setItem(KEYS.expenses, expenses);
    return expenses[index];
  }

  // Shoot day operations
  getShootDays(projectId?: string): ShootDay[] {
    const shootDays = this.getItem<ShootDay>(KEYS.shootDays);
    return projectId 
      ? shootDays.filter(s => s.projectId === projectId).sort((a, b) => a.date.localeCompare(b.date))
      : shootDays;
  }

  addShootDay(shootDayData: Omit<ShootDay, 'id' | 'createdAt'>): ShootDay {
    const shootDays = this.getShootDays();
    const newShootDay: ShootDay = {
      ...shootDayData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    };
    
    shootDays.push(newShootDay);
    this.setItem(KEYS.shootDays, shootDays);
    return newShootDay;
  }

  // Vendor operations
  getVendors(): Vendor[] {
    return this.getItem<Vendor>(KEYS.vendors);
  }

  addVendor(vendorData: Omit<Vendor, 'id' | 'createdAt'>): Vendor {
    const vendors = this.getVendors();
    const newVendor: Vendor = {
      ...vendorData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    };
    
    vendors.push(newVendor);
    this.setItem(KEYS.vendors, vendors);
    return newVendor;
  }

  // Petty cash operations
  getPettyCashFloats(projectId?: string): PettyCashFloat[] {
    const floats = this.getItem<PettyCashFloat>(KEYS.pettyCashFloats);
    return projectId 
      ? floats.filter(f => f.projectId === projectId)
      : floats;
  }

  addPettyCashFloat(floatData: Omit<PettyCashFloat, 'id' | 'createdAt'>): PettyCashFloat {
    const floats = this.getPettyCashFloats();
    const newFloat: PettyCashFloat = {
      ...floatData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    };
    
    floats.push(newFloat);
    this.setItem(KEYS.pettyCashFloats, floats);
    return newFloat;
  }

  updatePettyCashFloat(id: string, updates: Partial<Omit<PettyCashFloat, 'id' | 'createdAt'>>): PettyCashFloat | null {
    const floats = this.getPettyCashFloats();
    const index = floats.findIndex(f => f.id === id);
    
    if (index === -1) return null;
    
    floats[index] = { ...floats[index], ...updates };
    this.setItem(KEYS.pettyCashFloats, floats);
    return floats[index];
  }

  getPettyCashTxns(floatId?: string): PettyCashTxn[] {
    const txns = this.getItem<PettyCashTxn>(KEYS.pettyCashTxns);
    return floatId 
      ? txns.filter(t => t.floatId === floatId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : txns;
  }

  addPettyCashTxn(txnData: Omit<PettyCashTxn, 'id' | 'createdAt'>): PettyCashTxn {
    const txns = this.getPettyCashTxns();
    const newTxn: PettyCashTxn = {
      ...txnData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    };
    
    txns.push(newTxn);
    this.setItem(KEYS.pettyCashTxns, txns);
    return newTxn;
  }

  // Current project
  setCurrentProject(projectId: string): void {
    localStorage.setItem(getStorageKey(KEYS.currentProject), projectId);
  }

  getCurrentProject(): string | null {
    return localStorage.getItem(getStorageKey(KEYS.currentProject));
  }

  // Initialization and migrations
  initialize(): void {
    const version = localStorage.getItem(getStorageKey(KEYS.version));
    
    if (!version) {
      // First time setup - create demo data
      this.createDemoData();
      localStorage.setItem(getStorageKey(KEYS.version), STORAGE_VERSION);
    }
  }

  private createDemoData(): void {
    // Create demo project
    const demoProject = this.addProject({
      title: "Sample Short Film",
      currency: "INR",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalBudget: 500000,
    });

    this.setCurrentProject(demoProject.id);

    // Create departments
    const departments = [
      { name: "Pre-Production", budgetAmount: 100000 },
      { name: "Production", budgetAmount: 250000 },
      { name: "Post-Production", budgetAmount: 100000 },
      { name: "Marketing & Distribution", budgetAmount: 30000 },
      { name: "Admin & Misc", budgetAmount: 20000 },
    ];

    const createdDepts = departments.map(dept => 
      this.addDepartment({
        projectId: demoProject.id,
        name: dept.name,
        budgetAmount: dept.budgetAmount,
      })
    );

    // Create budget lines
    const budgetLines = [
      { deptName: "Pre-Production", lines: [
        { item: "Script Development", amount: 25000 },
        { item: "Location Scouting", amount: 35000 },
        { item: "Casting", amount: 40000 }
      ]},
      { deptName: "Production", lines: [
        { item: "Equipment Rental", amount: 120000 },
        { item: "Crew Payments", amount: 80000 },
        { item: "Catering", amount: 30000 },
        { item: "Transportation", amount: 20000 }
      ]},
      { deptName: "Post-Production", lines: [
        { item: "Editing", amount: 50000 },
        { item: "Sound Design", amount: 30000 },
        { item: "Color Grading", amount: 20000 }
      ]}
    ];

    budgetLines.forEach(({ deptName, lines }) => {
      const dept = createdDepts.find(d => d.name === deptName);
      if (dept) {
        lines.forEach(line => {
          this.addBudgetLine({
            projectId: demoProject.id,
            departmentId: dept.id,
            lineItem: line.item,
            budgetAmount: line.amount,
          });
        });
      }
    });

    // Create a shoot day
    const shootDay = this.addShootDay({
      projectId: demoProject.id,
      date: new Date().toISOString().split('T')[0],
      location: "Studio A, Film City",
      notes: "Principal photography - Interior scenes",
    });

    // Create sample vendors
    const vendors = [
      { name: "Camera House Mumbai", gstin: "27AABCU9603R1ZM", contacts: ["9876543210"] },
      { name: "Prime Focus Sound", gstin: "", contacts: ["9876543211"] },
      { name: "Catering Express", gstin: "27AABCU9603R1ZN", contacts: ["9876543212"] },
    ];

    const createdVendors = vendors.map(vendor => this.addVendor(vendor));

    // Create sample expenses
    const sampleExpenses = [
      {
        departmentId: createdDepts[1].id, // Production
        vendorId: createdVendors[0].id,
        description: "Camera equipment rental - Day 1",
        amount: 15000,
        paymentMethod: "Transfer" as const,
        status: "approved" as const,
        shootDayId: shootDay.id,
      },
      {
        departmentId: createdDepts[1].id, // Production
        vendorId: createdVendors[2].id,
        description: "Lunch catering for crew",
        amount: 3500,
        paymentMethod: "Cash" as const,
        status: "paid" as const,
        shootDayId: shootDay.id,
      },
      {
        departmentId: createdDepts[1].id, // Production
        description: "Transportation - Location to studio",
        amount: 1200,
        paymentMethod: "UPI" as const,
        status: "submitted" as const,
        reimbursable: true,
      },
    ];

    sampleExpenses.forEach(expense => {
      this.addExpense({
        ...expense,
        projectId: demoProject.id,
        date: new Date().toISOString().split('T')[0],
        taxRate: 18,
      });
    });

    // Create petty cash float
    const float = this.addPettyCashFloat({
      projectId: demoProject.id,
      ownerUserId: "assistant_director",
      issuedAmount: 10000,
      issuedAt: new Date().toISOString(),
      balance: 7800,
    });

    // Create petty cash transactions
    const pettyCashTxns = [
      {
        description: "Tea/coffee for crew",
        amount: 800,
        type: "debit" as const,
      },
      {
        description: "Parking fees",
        amount: 500,
        type: "debit" as const,
      },
      {
        description: "Miscellaneous snacks",
        amount: 900,
        type: "debit" as const,
      },
    ];

    pettyCashTxns.forEach(txn => {
      this.addPettyCashTxn({
        ...txn,
        floatId: float.id,
        date: new Date().toISOString().split('T')[0],
      });
    });
  }

  // Update vendor
  updateVendor(id: string, updates: Partial<Omit<Vendor, 'id' | 'createdAt'>>): Vendor {
    const vendors = this.getItem<Vendor>(KEYS.vendors);
    const index = vendors.findIndex(v => v.id === id);
    if (index === -1) throw new Error('Vendor not found');
    
    vendors[index] = { ...vendors[index], ...updates };
    this.setItem(KEYS.vendors, vendors);
    return vendors[index];
  }

  // Delete vendor
  deleteVendor(id: string): void {
    const vendors = this.getItem<Vendor>(KEYS.vendors);
    const filtered = vendors.filter(v => v.id !== id);
    this.setItem(KEYS.vendors, filtered);
  }

  // Update department
  updateDepartment(id: string, updates: Partial<Omit<Department, 'id' | 'projectId' | 'createdAt'>>): Department {
    const departments = this.getItem<Department>(KEYS.departments);
    const index = departments.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Department not found');
    
    departments[index] = { ...departments[index], ...updates };
    this.setItem(KEYS.departments, departments);
    return departments[index];
  }

  // Delete department  
  deleteDepartment(id: string): void {
    const departments = this.getItem<Department>(KEYS.departments);
    const filtered = departments.filter(d => d.id !== id);
    this.setItem(KEYS.departments, filtered);
  }

  // Update budget line
  updateBudgetLine(id: string, updates: Partial<Omit<BudgetLine, 'id' | 'projectId' | 'departmentId' | 'createdAt'>>): BudgetLine {
    const budgetLines = this.getItem<BudgetLine>(KEYS.budgetLines);
    const index = budgetLines.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Budget line not found');
    
    budgetLines[index] = { ...budgetLines[index], ...updates };
    this.setItem(KEYS.budgetLines, budgetLines);
    return budgetLines[index];
  }

  // Delete budget line
  deleteBudgetLine(id: string): void {
    const budgetLines = this.getItem<BudgetLine>(KEYS.budgetLines);
    const filtered = budgetLines.filter(b => b.id !== id);
    this.setItem(KEYS.budgetLines, filtered);
  }

  // Update petty cash float
  updatePettyCashFloat(id: string, updates: Partial<Omit<PettyCashFloat, 'id' | 'projectId' | 'ownerUserId' | 'issuedAmount' | 'issuedAt' | 'createdAt'>>): PettyCashFloat {
    const floats = this.getItem<PettyCashFloat>(KEYS.pettyCashFloats);
    const index = floats.findIndex(f => f.id === id);
    if (index === -1) throw new Error('Petty cash float not found');
    
    floats[index] = { ...floats[index], ...updates };
    this.setItem(KEYS.pettyCashFloats, floats);
    return floats[index];
  }

  // Initialize storage with demo data if first time
  initialize(): void {
    try {
      const isFirstTime = !localStorage.getItem(getStorageKey('initialized'));
      if (isFirstTime) {
        this.createDemoData();
        localStorage.setItem(getStorageKey('initialized'), 'true');
      }
    } catch (error) {
      console.error('Storage initialization failed:', error);
    }
  }

  // Clear all data (for testing)
  clearAllData(): void {
    Object.values(KEYS).forEach(key => {
      localStorage.removeItem(getStorageKey(key));
    });
  }
}

export const storage = new StorageManager();