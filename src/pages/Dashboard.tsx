import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { VarianceChip } from "@/components/ui/variance-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { BudgetChart } from "@/components/ui/budget-chart";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Calendar,
  Download,
  Camera,
  Users,
  Play
} from "lucide-react";
import { storage } from "@/lib/storage";
import { analytics } from "@/lib/analytics";
import { pdfService } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";
import type { Project, Expense, ShootDay } from "@/lib/types";

const Dashboard = () => {
  const { toast } = useToast();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedShootDay, setSelectedShootDay] = useState<string>("all");

  useEffect(() => {
    const projectId = storage.getCurrentProject();
    if (projectId) {
      const project = storage.getProject(projectId);
      setCurrentProject(project);
    }
  }, []);

  if (!currentProject) {
    return (
      <EmptyState
        icon={Camera}
        title="No Project Selected"
        description="Create a new project or select an existing one to get started with expense tracking."
        actionLabel="Create New Project"
        onAction={() => window.location.href = '/project/new'}
      />
    );
  }

  // Safely get analytics data with error handling
  let projectSummary, dailyReport, topDepartments;
  try {
    projectSummary = analytics.getProjectSummary(currentProject.id);
    dailyReport = analytics.getDailyCostReport(currentProject.id, selectedDate);
    topDepartments = analytics.getTopDepartmentsBySpend(currentProject.id, 3);
  } catch (error) {
    console.error('Error loading analytics:', error);
    projectSummary = {
      totalBudget: 0,
      totalSpent: 0,
      remainingBudget: 0,
      variancePercent: 0,
      departmentSummaries: [],
      expenseCount: 0
    };
    dailyReport = {
      date: selectedDate,
      projectId: currentProject.id,
      totalSpent: 0,
      expensesByDepartment: [],
      expenses: [],
      pettyCashTxns: []
    };
    topDepartments = [];
  }
  
  // Safely access values with defaults
  const totalSpent = projectSummary?.totalSpent ?? 0;
  const remainingBudget = projectSummary?.remainingBudget ?? 0;
  const dailySpent = dailyReport?.totalSpent ?? 0;
  
  const departments = storage.getDepartments(currentProject.id);
  const shootDays = storage.getShootDays(currentProject.id);
  
  // Filter expenses based on selections
  const expenses = storage.getExpenses(currentProject.id, {
    dateFrom: selectedDate,
    dateTo: selectedDate,
    departmentId: selectedDepartment !== "all" ? selectedDepartment : undefined,
    shootDayId: selectedShootDay !== "all" ? selectedShootDay : undefined,
  });

  const handleGenerateDCR = async () => {
    try {
      const pdfBlob = pdfService.generateDailyCostReport(currentProject.id, selectedDate);
      const filename = `DCR_${currentProject.title.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedDate}.pdf`;
      pdfService.downloadPDF(pdfBlob, filename);
      
      toast({
        title: "DCR Generated",
        description: "Daily Cost Report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate DCR. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPaymentMethodColor = (method: string) => {
    const colors = {
      Cash: "bg-warning/10 text-warning border-warning/20",
      UPI: "bg-success/10 text-success border-success/20",
      Card: "bg-primary/10 text-primary border-primary/20",
      Transfer: "bg-secondary/10 text-secondary border-secondary/20",
    };
    return colors[method as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      submitted: "bg-warning/10 text-warning border-warning/20",
      approved: "bg-success/10 text-success border-success/20",
      paid: "bg-primary/10 text-primary border-primary/20",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Daily Cost Report</h2>
          <p className="text-muted-foreground">
            Track daily expenses and generate reports for {currentProject.title}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleGenerateDCR} className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Generate DCR PDF</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => {
              const shootDays = storage.getShootDaysExtended(currentProject.id);
              if (shootDays.length > 0) {
                window.location.href = `/day/${shootDays[0].id}`;
              }
            }}
            className="flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Production Day Hub</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Shoot Day</label>
              <Select value={selectedShootDay} onValueChange={setSelectedShootDay}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {shootDays.map(day => (
                    <SelectItem key={day.id} value={day.id}>
                      {new Date(day.date).toLocaleDateString()} - {day.location || 'No location'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-success" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-foreground">
                  {currentProject.currency} {totalSpent.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Remaining Budget</p>
                <p className="text-2xl font-bold text-foreground">
                  {currentProject.currency} {remainingBudget.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-warning" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Today's Expenses</p>
                <p className="text-2xl font-bold text-foreground">{expenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-secondary" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Daily Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {currentProject.currency} {dailySpent.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Departments */}
      {topDepartments && topDepartments.length > 0 && (
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Top Departments by Spend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDepartments.map((dept, index) => {
                const percentage = projectSummary.totalSpent > 0 
                  ? (dept.actualAmount / projectSummary.totalSpent) * 100 
                  : 0
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium">{index + 1}.</div>
                      <div>
                        <p className="font-medium">{dept.departmentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {percentage.toFixed(1)}% of total spend
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {currentProject.currency} {dept.actualAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget vs Actual Chart */}
      {projectSummary?.departmentSummaries && projectSummary.departmentSummaries.length > 0 && (
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Budget vs Actual by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetChart 
              data={analytics.getBudgetVsActualChartData(currentProject.id)}
              currency={currentProject.currency}
            />
          </CardContent>
        </Card>
      )}

      {/* Today's Expenses */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Expenses for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Expenses Found"
              description="No expenses recorded for the selected date and filters."
              actionLabel="Add Expense"
              onAction={() => window.location.href = '/project/add-expense'}
            />
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => {
                const department = departments.find(d => d.id === expense.departmentId);
                const vendors = storage.getVendors();
                const vendor = expense.vendorId ? vendors.find(v => v.id === expense.vendorId) : null;
                
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-quick"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-foreground">{expense.description}</h4>
                        <Badge 
                          variant="outline" 
                          className={getPaymentMethodColor(expense.paymentMethod)}
                        >
                          {expense.paymentMethod}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(expense.status)}
                        >
                          {expense.status}
                        </Badge>
                        {expense.reimbursable && (
                          <Badge variant="secondary">Reimbursable</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{department?.name}</span>
                        {vendor && <span>• {vendor.name}</span>}
                        <span>• {new Date(expense.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">
                        {currentProject.currency} {expense.amount.toLocaleString()}
                      </p>
                      {expense.taxRate > 0 && (
                        <p className="text-xs text-muted-foreground">
                          +{expense.taxRate}% tax
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;