// Local storage utilities for offline-first functionality

import type { 
  Project, 
  Department, 
  BudgetLine, 
  ShootDay, 
  Vendor, 
  Expense, 
  PettyCashFloat, 
  PettyCashTxn,
  ShootDayExtended,
  ScheduleItem,
  Crew,
  CrewFeedback,
  Prop,
  PropCheckout,
  ExpenseExtended,
  ProductionDaySummary,
  ScheduleAdherenceReport,
  PropsCustodyReport,
  CrewPerformanceReport
} from './types';

const STORAGE_VERSION = '1.0';
const STORAGE_PREFIX = 'film_expense_tracker_';

// Storage keys
const KEYS = {
  projects: 'projects',
  departments: 'departments',
  budgetLines: 'budget_lines',
  shootDays: 'shoot_days',
  shootDaysExtended: 'shoot_days_extended',
  scheduleItems: 'schedule_items',
  crew: 'crew',
  crewFeedback: 'crew_feedback',
  props: 'props',
  propCheckouts: 'prop_checkouts',
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

    // Create extended shoot day with production details
    const extendedShootDay = this.addShootDayExtended({
      projectId: demoProject.id,
      date: new Date().toISOString().split('T')[0],
      location: "Studio A, Film City",
      callTime: "08:00",
      wrapTime: "18:00",
      weatherNote: "Clear skies, 25°C",
      status: "open",
      notes: "Principal photography - Interior scenes",
    });

    // Create crew members
    const crewMembers = [
      { name: "Rajesh Kumar", role: "Director", contact: "9876543210" },
      { name: "Priya Sharma", role: "Producer", contact: "9876543211" },
      { name: "Amit Singh", role: "Cinematographer", contact: "9876543212" },
      { name: "Sneha Patel", role: "Sound Engineer", contact: "9876543213" },
      { name: "Vikram Joshi", role: "Assistant Director", contact: "9876543214" },
    ];

    const createdCrew = crewMembers.map(member => 
      this.addCrew({
        projectId: demoProject.id,
        name: member.name,
        role: member.role,
        contact: member.contact,
      })
    );

    // Create vendors first (needed for props)
    const vendors = [
      { name: "Camera House Mumbai", gstin: "27AABCU9603R1ZM", contacts: ["9876543210"] },
      { name: "Prime Focus Sound", gstin: "", contacts: ["9876543211"] },
      { name: "Catering Express", gstin: "27AABCU9603R1ZN", contacts: ["9876543212"] },
    ];

    const createdVendors = vendors.map(vendor => this.addVendor(vendor));

    // Create props
    const props = [
      { name: "Canon EOS R5", category: "Camera", serialNo: "CN001", ownerVendorId: createdVendors[0].id },
      { name: "Rode Microphone", category: "Audio", serialNo: "RD001", ownerVendorId: createdVendors[1].id },
      { name: "LED Panel Light", category: "Lighting", serialNo: "LP001", ownerVendorId: createdVendors[0].id },
      { name: "Tripod", category: "Support", serialNo: "TP001", ownerVendorId: createdVendors[0].id },
    ];

    const createdProps = props.map(prop => 
      this.addProp({
        projectId: demoProject.id,
        name: prop.name,
        category: prop.category,
        serialNo: prop.serialNo,
        ownerVendorId: prop.ownerVendorId,
        notes: "Professional grade equipment",
      })
    );

    // Create schedule items
    const scheduleItems = [
      {
        scene: "Scene 1",
        shot: "Shot A",
        description: "Opening dialogue between protagonist and antagonist",
        plannedStart: "09:00",
        plannedEnd: "10:30",
        actualStart: "09:15",
        actualEnd: "10:45",
        assignees: ["Rajesh Kumar", "Amit Singh"],
        status: "done" as const,
        notes: "Slight delay due to lighting setup",
      },
      {
        scene: "Scene 1",
        shot: "Shot B",
        description: "Close-up reaction shot",
        plannedStart: "10:30",
        plannedEnd: "11:00",
        actualStart: "10:45",
        actualEnd: "11:15",
        assignees: ["Amit Singh", "Sneha Patel"],
        status: "done" as const,
        notes: "Completed on time",
      },
      {
        scene: "Scene 2",
        shot: "Shot A",
        description: "Establishing shot of location",
        plannedStart: "11:00",
        plannedEnd: "12:00",
        assignees: ["Amit Singh", "Vikram Joshi"],
        status: "in_progress" as const,
        notes: "Currently shooting",
      },
      {
        scene: "Scene 2",
        shot: "Shot B",
        description: "Wide angle action sequence",
        plannedStart: "12:00",
        plannedEnd: "13:30",
        assignees: ["Rajesh Kumar", "Amit Singh", "Sneha Patel"],
        status: "planned" as const,
        notes: "Scheduled for after lunch",
      },
    ];

    scheduleItems.forEach(item => {
      this.addScheduleItem({
        ...item,
        shootDayId: extendedShootDay.id,
      });
    });

    // Create crew feedback
    const feedbackItems = [
      {
        crewId: createdCrew[0].id,
        isAnonymous: false,
        rating: 4,
        tags: ["coordination", "setup"],
        notes: "Good communication, but lighting setup took longer than expected",
      },
      {
        crewId: createdCrew[1].id,
        isAnonymous: false,
        rating: 5,
        tags: ["comms"],
        notes: "Excellent coordination and clear instructions",
      },
      {
        isAnonymous: true,
        rating: 3,
        tags: ["delays", "sound"],
        notes: "Some audio issues with background noise",
      },
    ];

    feedbackItems.forEach(feedback => {
      this.addCrewFeedback({
        ...feedback,
        shootDayId: extendedShootDay.id,
      });
    });

    // Create prop checkouts
    const propCheckouts = [
      {
        propId: createdProps[0].id,
        checkedOutBy: "Amit Singh",
        dueReturn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkoutCondition: "Excellent condition, fully functional",
        status: "out" as const,
      },
      {
        propId: createdProps[1].id,
        checkedOutBy: "Sneha Patel",
        dueReturn: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkoutCondition: "Good condition, minor wear",
        status: "out" as const,
      },
      {
        propId: createdProps[2].id,
        checkedOutBy: "Vikram Joshi",
        dueReturn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkoutCondition: "Good condition",
        status: "overdue" as const,
      },
    ];

    propCheckouts.forEach(checkout => {
      this.addPropCheckout({
        ...checkout,
        shootDayId: extendedShootDay.id,
      });
    });

    // Vendors already created above

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


  // Delete department  
  deleteDepartment(id: string): void {
    const departments = this.getItem<Department>(KEYS.departments);
    const filtered = departments.filter(d => d.id !== id);
    this.setItem(KEYS.departments, filtered);
  }


  // Delete budget line
  deleteBudgetLine(id: string): void {
    const budgetLines = this.getItem<BudgetLine>(KEYS.budgetLines);
    const filtered = budgetLines.filter(b => b.id !== id);
    this.setItem(KEYS.budgetLines, filtered);
  }



  // Production Day Ops - Shoot Day Extended operations
  getShootDaysExtended(projectId?: string): ShootDayExtended[] {
    const shootDays = this.getItem<ShootDayExtended>(KEYS.shootDaysExtended);
    return projectId 
      ? shootDays.filter(s => s.projectId === projectId).sort((a, b) => a.date.localeCompare(b.date))
      : shootDays;
  }

  addShootDayExtended(shootDayData: Omit<ShootDayExtended, 'id' | 'createdAt'>): ShootDayExtended {
    const shootDays = this.getShootDaysExtended();
    const newShootDay: ShootDayExtended = {
      ...shootDayData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    };
    
    shootDays.push(newShootDay);
    this.setItem(KEYS.shootDaysExtended, shootDays);
    return newShootDay;
  }

  updateShootDayExtended(id: string, updates: Partial<Omit<ShootDayExtended, 'id' | 'createdAt'>>): ShootDayExtended | null {
    const shootDays = this.getShootDaysExtended();
    const index = shootDays.findIndex(s => s.id === id);
    
    if (index === -1) return null;
    
    shootDays[index] = { ...shootDays[index], ...updates };
    this.setItem(KEYS.shootDaysExtended, shootDays);
    return shootDays[index];
  }

  getShootDayExtended(id: string): ShootDayExtended | null {
    const shootDays = this.getShootDaysExtended();
    return shootDays.find(s => s.id === id) || null;
  }

  // Schedule Items operations
  getScheduleItems(shootDayId?: string): ScheduleItem[] {
    const items = this.getItem<ScheduleItem>(KEYS.scheduleItems);
    return shootDayId 
      ? items.filter(i => i.shootDayId === shootDayId).sort((a, b) => a.plannedStart?.localeCompare(b.plannedStart || '') || 0)
      : items;
  }

  addScheduleItem(itemData: Omit<ScheduleItem, 'id' | 'createdAt'>): ScheduleItem {
    const items = this.getScheduleItems();
    const newItem: ScheduleItem = {
      ...itemData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    };
    
    items.push(newItem);
    this.setItem(KEYS.scheduleItems, items);
    return newItem;
  }

  updateScheduleItem(id: string, updates: Partial<Omit<ScheduleItem, 'id' | 'createdAt'>>): ScheduleItem | null {
    const items = this.getScheduleItems();
    const index = items.findIndex(i => i.id === id);
    
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    this.setItem(KEYS.scheduleItems, items);
    return items[index];
  }

  deleteScheduleItem(id: string): void {
    const items = this.getScheduleItems();
    const filtered = items.filter(i => i.id !== id);
    this.setItem(KEYS.scheduleItems, filtered);
  }

  // Crew operations
  getCrew(projectId?: string): Crew[] {
    const crew = this.getItem<Crew>(KEYS.crew);
    return projectId 
      ? crew.filter(c => c.projectId === projectId)
      : crew;
  }

  addCrew(crewData: Omit<Crew, 'id' | 'createdAt'>): Crew {
    const crew = this.getCrew();
    const newCrew: Crew = {
      ...crewData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    };
    
    crew.push(newCrew);
    this.setItem(KEYS.crew, crew);
    return newCrew;
  }

  updateCrew(id: string, updates: Partial<Omit<Crew, 'id' | 'createdAt'>>): Crew | null {
    const crew = this.getCrew();
    const index = crew.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    crew[index] = { ...crew[index], ...updates };
    this.setItem(KEYS.crew, crew);
    return crew[index];
  }

  deleteCrew(id: string): void {
    const crew = this.getCrew();
    const filtered = crew.filter(c => c.id !== id);
    this.setItem(KEYS.crew, filtered);
  }

  // Crew Feedback operations
  getCrewFeedback(shootDayId?: string): CrewFeedback[] {
    const feedback = this.getItem<CrewFeedback>(KEYS.crewFeedback);
    return shootDayId 
      ? feedback.filter(f => f.shootDayId === shootDayId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : feedback;
  }

  addCrewFeedback(feedbackData: Omit<CrewFeedback, 'id' | 'createdAt'>): CrewFeedback {
    const feedback = this.getCrewFeedback();
    const newFeedback: CrewFeedback = {
      ...feedbackData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    };
    
    feedback.push(newFeedback);
    this.setItem(KEYS.crewFeedback, feedback);
    return newFeedback;
  }

  updateCrewFeedback(id: string, updates: Partial<Omit<CrewFeedback, 'id' | 'createdAt'>>): CrewFeedback | null {
    const feedback = this.getCrewFeedback();
    const index = feedback.findIndex(f => f.id === id);
    
    if (index === -1) return null;
    
    feedback[index] = { ...feedback[index], ...updates };
    this.setItem(KEYS.crewFeedback, feedback);
    return feedback[index];
  }

  // Props operations
  getProps(projectId?: string): Prop[] {
    const props = this.getItem<Prop>(KEYS.props);
    return projectId 
      ? props.filter(p => p.projectId === projectId)
      : props;
  }

  addProp(propData: Omit<Prop, 'id' | 'createdAt'>): Prop {
    const props = this.getProps();
    const newProp: Prop = {
      ...propData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    };
    
    props.push(newProp);
    this.setItem(KEYS.props, props);
    return newProp;
  }

  updateProp(id: string, updates: Partial<Omit<Prop, 'id' | 'createdAt'>>): Prop | null {
    const props = this.getProps();
    const index = props.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    props[index] = { ...props[index], ...updates };
    this.setItem(KEYS.props, props);
    return props[index];
  }

  deleteProp(id: string): void {
    const props = this.getProps();
    const filtered = props.filter(p => p.id !== id);
    this.setItem(KEYS.props, filtered);
  }

  // Prop Checkout operations
  getPropCheckouts(shootDayId?: string, status?: string): PropCheckout[] {
    let checkouts = this.getItem<PropCheckout>(KEYS.propCheckouts);
    
    if (shootDayId) {
      checkouts = checkouts.filter(c => c.shootDayId === shootDayId);
    }
    
    if (status) {
      checkouts = checkouts.filter(c => c.status === status);
    }
    
    return checkouts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addPropCheckout(checkoutData: Omit<PropCheckout, 'id' | 'createdAt'>): PropCheckout {
    const checkouts = this.getPropCheckouts();
    const newCheckout: PropCheckout = {
      ...checkoutData,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    };
    
    checkouts.push(newCheckout);
    this.setItem(KEYS.propCheckouts, checkouts);
    return newCheckout;
  }

  updatePropCheckout(id: string, updates: Partial<Omit<PropCheckout, 'id' | 'createdAt'>>): PropCheckout | null {
    const checkouts = this.getPropCheckouts();
    const index = checkouts.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    checkouts[index] = { ...checkouts[index], ...updates };
    this.setItem(KEYS.propCheckouts, checkouts);
    return checkouts[index];
  }

  // Analytics for Production Day
  getProductionDaySummary(shootDayId: string): ProductionDaySummary | null {
    const shootDay = this.getShootDayExtended(shootDayId);
    if (!shootDay) return null;

    const expenses = this.getExpenses(shootDay.projectId, { shootDayId });
    const scheduleItems = this.getScheduleItems(shootDayId);
    const crewFeedback = this.getCrewFeedback(shootDayId);
    const propCheckouts = this.getPropCheckouts(shootDayId);

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const departments = this.getDepartments(shootDay.projectId);
    const totalBudget = departments.reduce((sum, d) => sum + d.budgetAmount, 0);
    const variance = totalSpent - totalBudget;
    const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    const scheduleProgress = {
      total: scheduleItems.length,
      completed: scheduleItems.filter(i => i.status === 'done').length,
      inProgress: scheduleItems.filter(i => i.status === 'in_progress').length,
      dropped: scheduleItems.filter(i => i.status === 'dropped').length,
      percentage: scheduleItems.length > 0 ? (scheduleItems.filter(i => i.status === 'done').length / scheduleItems.length) * 100 : 0,
    };

    const crewFeedbackSummary = {
      totalResponses: crewFeedback.length,
      averageRating: crewFeedback.length > 0 ? crewFeedback.reduce((sum, f) => sum + f.rating, 0) / crewFeedback.length : 0,
      topIssues: this.getTopFeedbackTags(crewFeedback),
    };

    const propsStatus = {
      total: propCheckouts.length,
      checkedOut: propCheckouts.filter(c => c.status === 'out').length,
      returned: propCheckouts.filter(c => c.status === 'returned').length,
      overdue: propCheckouts.filter(c => c.status === 'overdue').length,
    };

    return {
      shootDayId,
      date: shootDay.date,
      location: shootDay.location || '',
      callTime: shootDay.callTime || '',
      wrapTime: shootDay.wrapTime || '',
      status: shootDay.status,
      totalBudget,
      totalSpent,
      variance,
      variancePercent,
      scheduleProgress,
      crewFeedback: crewFeedbackSummary,
      propsStatus,
    };
  }

  getScheduleAdherenceReport(shootDayId: string): ScheduleAdherenceReport | null {
    const shootDay = this.getShootDayExtended(shootDayId);
    if (!shootDay) return null;

    const scheduleItems = this.getScheduleItems(shootDayId);
    const completedShots = scheduleItems.filter(i => i.status === 'done').length;
    const droppedShots = scheduleItems.filter(i => i.status === 'dropped').length;
    const completionPercentage = scheduleItems.length > 0 ? (completedShots / scheduleItems.length) * 100 : 0;

    // Calculate time variances
    let overTime = 0;
    let underTime = 0;
    let totalDelay = 0;
    const blockedReasons: string[] = [];
    const delayReasons: Record<string, { count: number; totalDelay: number }> = {};

    scheduleItems.forEach(item => {
      if (item.plannedStart && item.plannedEnd && item.actualStart && item.actualEnd) {
        const plannedDuration = this.timeToMinutes(item.plannedEnd) - this.timeToMinutes(item.plannedStart);
        const actualDuration = this.timeToMinutes(item.actualEnd) - this.timeToMinutes(item.actualStart);
        const variance = actualDuration - plannedDuration;
        
        if (variance > 0) {
          overTime += variance;
          totalDelay += variance;
        } else {
          underTime += Math.abs(variance);
        }

        if (item.notes && item.notes.toLowerCase().includes('delay')) {
          const reason = item.notes.split('delay')[1]?.trim() || 'Unknown delay';
          blockedReasons.push(reason);
          if (!delayReasons[reason]) {
            delayReasons[reason] = { count: 0, totalDelay: 0 };
          }
          delayReasons[reason].count++;
          delayReasons[reason].totalDelay += Math.abs(variance);
        }
      }
    });

    const topDelays = Object.entries(delayReasons)
      .map(([reason, data]) => ({
        reason,
        count: data.count,
        totalDelay: data.totalDelay,
      }))
      .sort((a, b) => b.totalDelay - a.totalDelay)
      .slice(0, 5);

    return {
      shootDayId,
      date: shootDay.date,
      totalShots: scheduleItems.length,
      completedShots,
      droppedShots,
      completionPercentage,
      timeVariance: {
        overTime,
        underTime,
        averageDelay: scheduleItems.length > 0 ? totalDelay / scheduleItems.length : 0,
      },
      blockedReasons: [...new Set(blockedReasons)],
      topDelays,
    };
  }

  getPropsCustodyReport(shootDayId: string): PropsCustodyReport | null {
    const shootDay = this.getShootDayExtended(shootDayId);
    if (!shootDay) return null;

    const propCheckouts = this.getPropCheckouts(shootDayId);
    const props = this.getProps();
    const today = new Date().toISOString().split('T')[0];

    const openCheckouts = propCheckouts
      .filter(c => c.status === 'out')
      .map(c => {
        const prop = props.find(p => p.id === c.propId);
        const dueDate = new Date(c.dueReturn);
        const todayDate = new Date(today);
        const daysOverdue = Math.max(0, Math.ceil((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
        
        return {
          propName: prop?.name || 'Unknown Prop',
          checkedOutBy: c.checkedOutBy,
          dueReturn: c.dueReturn,
          daysOverdue,
          condition: c.checkoutCondition || 'Good',
        };
      });

    const overdueReturns = propCheckouts
      .filter(c => c.status === 'overdue')
      .map(c => {
        const prop = props.find(p => p.id === c.propId);
        const dueDate = new Date(c.dueReturn);
        const todayDate = new Date(today);
        const daysOverdue = Math.max(0, Math.ceil((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
        
        return {
          propName: prop?.name || 'Unknown Prop',
          checkedOutBy: c.checkedOutBy,
          dueReturn: c.dueReturn,
          daysOverdue,
        };
      });

    const returnedToday = propCheckouts
      .filter(c => c.status === 'returned' && c.returnedAt?.startsWith(today))
      .map(c => {
        const prop = props.find(p => p.id === c.propId);
        return {
          propName: prop?.name || 'Unknown Prop',
          returnedBy: c.checkedOutBy, // Assuming same person returned
          returnCondition: c.returnCondition || 'Good',
          returnedAt: c.returnedAt || '',
        };
      });

    return {
      shootDayId,
      date: shootDay.date,
      openCheckouts,
      overdueReturns,
      returnedToday,
    };
  }

  getCrewPerformanceReport(shootDayId: string): CrewPerformanceReport | null {
    const shootDay = this.getShootDayExtended(shootDayId);
    if (!shootDay) return null;

    const crewFeedback = this.getCrewFeedback(shootDayId);
    const totalResponses = crewFeedback.length;
    
    if (totalResponses === 0) {
      return {
        shootDayId,
        date: shootDay.date,
        totalResponses: 0,
        averageRating: 0,
        ratingDistribution: [],
        topIssues: [],
        anonymousResponses: 0,
        namedResponses: 0,
      };
    }

    const averageRating = crewFeedback.reduce((sum, f) => sum + f.rating, 0) / totalResponses;
    
    // Rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => {
      const count = crewFeedback.filter(f => f.rating === rating).length;
      return {
        rating,
        count,
        percentage: (count / totalResponses) * 100,
      };
    });

    // Top issues from tags
    const allTags = crewFeedback.flatMap(f => f.tags);
    const tagCounts: Record<string, number> = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    const topIssues = Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: (count / totalResponses) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const anonymousResponses = crewFeedback.filter(f => f.isAnonymous).length;
    const namedResponses = totalResponses - anonymousResponses;

    return {
      shootDayId,
      date: shootDay.date,
      totalResponses,
      averageRating,
      ratingDistribution,
      topIssues,
      anonymousResponses,
      namedResponses,
    };
  }

  // Helper methods
  private getTopFeedbackTags(feedback: CrewFeedback[]): string[] {
    const allTags = feedback.flatMap(f => f.tags);
    const tagCounts: Record<string, number> = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);
  }

  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Clear all data (for testing)
  clearAllData(): void {
    Object.values(KEYS).forEach(key => {
      localStorage.removeItem(getStorageKey(key));
    });
  }
}

export const storage = new StorageManager();