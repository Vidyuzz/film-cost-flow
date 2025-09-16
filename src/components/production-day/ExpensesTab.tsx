import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Receipt, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Banknote,
  Building2,
  FileText,
  Edit,
  Trash2,
  Save,
  Upload
} from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import type { Expense, Department, BudgetLine, Vendor } from "@/lib/types";

interface ExpensesTabProps {
  shootDayId: string;
  projectId: string;
  isLocked: boolean;
  onDataChange: () => void;
}

const ExpensesTab = ({ shootDayId, projectId, isLocked, onDataChange }: ExpensesTabProps) => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    departmentId: "",
    budgetLineId: "",
    vendorId: "",
    paymentMethod: "Cash" as const,
    status: "submitted" as const,
    reimbursable: false,
    taxRate: "0",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [shootDayId, projectId]);

  const loadData = () => {
    const dayExpenses = storage.getExpenses(projectId, { shootDayId });
    setExpenses(dayExpenses);
    
    const projectDepartments = storage.getDepartments(projectId);
    setDepartments(projectDepartments);
    
    const projectBudgetLines = storage.getBudgetLines(projectId);
    setBudgetLines(projectBudgetLines);
    
    const allVendors = storage.getVendors();
    setVendors(allVendors);
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      departmentId: "",
      budgetLineId: "",
      vendorId: "",
      paymentMethod: "Cash",
      status: "submitted",
      reimbursable: false,
      taxRate: "0",
      notes: "",
    });
    setEditingExpense(null);
  };

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        departmentId: expense.departmentId,
        budgetLineId: expense.budgetLineId || "",
        vendorId: expense.vendorId || "",
        paymentMethod: expense.paymentMethod,
        status: expense.status,
        reimbursable: expense.reimbursable,
        taxRate: expense.taxRate.toString(),
        notes: "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.description || !formData.amount || !formData.departmentId) {
      toast({
        title: "Validation Error",
        description: "Description, amount, and department are required fields.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      const expenseData = {
        projectId,
        shootDayId,
        departmentId: formData.departmentId,
        budgetLineId: formData.budgetLineId || undefined,
        vendorId: formData.vendorId || undefined,
        date: new Date().toISOString().split('T')[0],
        description: formData.description,
        amount,
        taxRate: parseFloat(formData.taxRate) || 0,
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        reimbursable: formData.reimbursable,
        notes: formData.notes,
      };

      if (editingExpense) {
        storage.updateExpense(editingExpense.id, expenseData);
        toast({
          title: "Expense Updated",
          description: "The expense has been updated successfully.",
        });
      } else {
        storage.addExpense(expenseData);
        toast({
          title: "Expense Added",
          description: "The expense has been added successfully.",
        });
      }
      
      loadData();
      onDataChange();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    if (isLocked) return;
    
    storage.updateExpense(id, { status: "cancelled" });
    loadData();
    onDataChange();
    toast({
      title: "Expense Cancelled",
      description: "The expense has been cancelled successfully.",
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Cash':
        return <Banknote className="h-4 w-4" />;
      case 'UPI':
        return <Smartphone className="h-4 w-4" />;
      case 'Card':
        return <CreditCard className="h-4 w-4" />;
      case 'Transfer':
        return <Building2 className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'Cash':
        return "bg-warning/10 text-warning border-warning/20";
      case 'UPI':
        return "bg-success/10 text-success border-success/20";
      case 'Card':
        return "bg-primary/10 text-primary border-primary/20";
      case 'Transfer':
        return "bg-secondary/10 text-secondary border-secondary/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return "bg-warning/10 text-warning border-warning/20";
      case 'approved':
        return "bg-success/10 text-success border-success/20";
      case 'paid':
        return "bg-primary/10 text-primary border-primary/20";
      case 'cancelled':
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const getDepartmentBudgetLines = (departmentId: string) => {
    return budgetLines.filter(line => line.departmentId === departmentId);
  };

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalWithTax = expenses.reduce((sum, expense) => {
    const taxAmount = (expense.amount * expense.taxRate) / 100;
    return sum + expense.amount + taxAmount;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Expenses & Settlements</h3>
          <p className="text-sm text-muted-foreground">
            {expenses.length} expenses • ₹{totalAmount.toLocaleString()} total
          </p>
        </div>
        {!isLocked && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? 'Edit Expense' : 'Add Expense'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the expense..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={formData.departmentId}
                      onValueChange={(value) => setFormData({ ...formData, departmentId: value, budgetLineId: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department..." />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="budgetLine">Budget Line</Label>
                    <Select
                      value={formData.budgetLineId}
                      onValueChange={(value) => setFormData({ ...formData, budgetLineId: value })}
                      disabled={!formData.departmentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget line..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getDepartmentBudgetLines(formData.departmentId).map(line => (
                          <SelectItem key={line.id} value={line.id}>
                            {line.lineItem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor">Vendor</Label>
                    <Select
                      value={formData.vendorId}
                      onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="reimbursable"
                      checked={formData.reimbursable}
                      onChange={(e) => setFormData({ ...formData, reimbursable: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="reimbursable">Reimbursable</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingExpense ? 'Update' : 'Add'} Expense
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Tax</p>
                <p className="text-2xl font-bold">₹{totalWithTax.toLocaleString()}</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tax Amount</p>
                <p className="text-2xl font-bold">₹{(totalWithTax - totalAmount).toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Expenses</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding expenses for this production day.
              </p>
              {!isLocked && (
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Expense
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          expenses.map((expense) => {
            const department = departments.find(d => d.id === expense.departmentId);
            const budgetLine = budgetLines.find(b => b.id === expense.budgetLineId);
            const vendor = vendors.find(v => v.id === expense.vendorId);
            const taxAmount = (expense.amount * expense.taxRate) / 100;
            const totalAmount = expense.amount + taxAmount;

            return (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium">{expense.description}</span>
                        <Badge variant="outline" className={getPaymentMethodColor(expense.paymentMethod)}>
                          {getPaymentMethodIcon(expense.paymentMethod)}
                          <span className="ml-1">{expense.paymentMethod}</span>
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(expense.status)}>
                          {expense.status}
                        </Badge>
                        {expense.reimbursable && (
                          <Badge variant="secondary">Reimbursable</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>{department?.name}</span>
                        {budgetLine && <span>• {budgetLine.lineItem}</span>}
                        {vendor && <span>• {vendor.name}</span>}
                        <span>• {new Date(expense.createdAt).toLocaleTimeString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">₹{expense.amount.toLocaleString()}</span>
                        {expense.taxRate > 0 && (
                          <span className="text-muted-foreground">
                            + {expense.taxRate}% tax = ₹{totalAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {!isLocked && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExpensesTab;

