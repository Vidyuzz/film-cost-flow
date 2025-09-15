import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Plus, Filter, Receipt } from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import type { Project, Expense } from "@/lib/types";

const Expenses = () => {
  const { toast } = useToast();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");

  useEffect(() => {
    const projectId = storage.getCurrentProject();
    if (projectId) {
      const project = storage.getProject(projectId);
      setCurrentProject(project);
      loadExpenses(projectId);
    }
  }, []);

  const loadExpenses = (projectId: string) => {
    const allExpenses = storage.getExpenses(projectId);
    setExpenses(allExpenses);
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || expense.departmentId === filterDepartment;
    const matchesStatus = filterStatus === "all" || expense.status === filterStatus;
    const matchesPaymentMethod = filterPaymentMethod === "all" || expense.paymentMethod === filterPaymentMethod;
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesPaymentMethod;
  });

  const updateExpenseStatus = (expenseId: string, newStatus: "submitted" | "approved" | "paid") => {
    if (!currentProject) return;
    
    const updated = storage.updateExpense(expenseId, { status: newStatus });
    if (updated) {
      loadExpenses(currentProject.id);
      toast({
        title: "Status Updated",
        description: `Expense status changed to ${newStatus}.`,
      });
    }
  };

  if (!currentProject) {
    return (
      <EmptyState
        icon={Receipt}
        title="No Project Selected"
        description="Please select a project to view expenses."
      />
    );
  }

  const departments = storage.getDepartments(currentProject.id);
  const vendors = storage.getVendors();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Expenses</h2>
          <p className="text-muted-foreground">
            Manage and track all project expenses
          </p>
        </div>
        
        <Button asChild>
          <a href="/project/add-expense" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </a>
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
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

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setFilterDepartment("all");
                setFilterStatus("all");
                setFilterPaymentMethod("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>
            Expenses ({filteredExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Expenses Found"
              description="No expenses match your current filters."
              actionLabel="Add New Expense"
              onAction={() => window.location.href = '/project/add-expense'}
            />
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => {
                const department = departments.find(d => d.id === expense.departmentId);
                const vendor = expense.vendorId ? vendors.find(v => v.id === expense.vendorId) : null;
                
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-quick"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-foreground">{expense.description}</h4>
                        <Badge variant="outline">
                          {expense.paymentMethod}
                        </Badge>
                        <Select 
                          value={expense.status} 
                          onValueChange={(value) => updateExpenseStatus(expense.id, value as any)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                        {expense.reimbursable && (
                          <Badge variant="secondary">Reimbursable</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{department?.name}</span>
                        {vendor && <span>• {vendor.name}</span>}
                        <span>• {new Date(expense.date).toLocaleDateString()}</span>
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

export default Expenses;