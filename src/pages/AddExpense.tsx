import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Receipt, Plus, Calendar } from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { ExpenseCreateSchema } from "@/lib/types";
import type { Project, Department, Vendor, ShootDay, BudgetLine } from "@/lib/types";

const AddExpense = () => {
  const { toast } = useToast();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [shootDays, setShootDays] = useState<ShootDay[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof ExpenseCreateSchema>>({
    resolver: zodResolver(ExpenseCreateSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      taxRate: 18,
      paymentMethod: "Cash",
      status: "submitted",
      reimbursable: false,
      description: "",
      budgetLineId: "none",
      vendorId: "none", 
      shootDayId: "none",
    },
  });

  useEffect(() => {
    const projectId = storage.getCurrentProject();
    if (projectId) {
      const project = storage.getProject(projectId);
      setCurrentProject(project);
      
      const depts = storage.getDepartments(projectId);
      setDepartments(depts);
      
      const allVendors = storage.getVendors();
      setVendors(allVendors);
      
      const projectShootDays = storage.getShootDays(projectId);
      setShootDays(projectShootDays);
    }
  }, []);

  useEffect(() => {
    if (selectedDepartment && currentProject) {
      const lines = storage.getBudgetLines(currentProject.id, selectedDepartment);
      setBudgetLines(lines);
    } else {
      setBudgetLines([]);
    }
  }, [selectedDepartment, currentProject]);

  const onSubmit = async (values: z.infer<typeof ExpenseCreateSchema>) => {
    if (!currentProject) {
      toast({
        title: "Error",
        description: "No project selected.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean up the values - convert "none" to undefined for optional fields
      const cleanedValues = {
        ...values,
        budgetLineId: values.budgetLineId === "none" ? undefined : values.budgetLineId,
        vendorId: values.vendorId === "none" ? undefined : values.vendorId,
        shootDayId: values.shootDayId === "none" ? undefined : values.shootDayId,
      };

      const newExpense = storage.addExpense({
        ...cleanedValues,
        projectId: currentProject.id,
      });

      toast({
        title: "Expense Added",
        description: `Successfully added expense: ${values.description}`,
      });

      // Reset form
      form.reset({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        taxRate: 18,
        paymentMethod: "Cash",
        status: "submitted",
        reimbursable: false,
        description: "",
        departmentId: "",
        budgetLineId: "none",
        vendorId: "none",
        shootDayId: "none",
      });
      setSelectedDepartment("");

      // Navigate back to expenses or dashboard
      setTimeout(() => {
        window.location.href = '/expenses';
      }, 1000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000];

  if (!currentProject) {
    return (
      <EmptyState
        icon={Receipt}
        title="No Project Selected"
        description="Please select a project to add expenses."
        actionLabel="Go to Dashboard"
        onAction={() => window.location.href = '/'}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <a href="/expenses" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Expenses</span>
          </a>
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Add New Expense</h2>
          <p className="text-muted-foreground">
            Record a new expense for {currentProject.title}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <span>Expense Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department *</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedDepartment(value);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments.map(dept => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="budgetLineId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Line Item</FormLabel>
                          <Select value={field.value || "none"} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select line item (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No specific line item</SelectItem>
                              {budgetLines.map(line => (
                                <SelectItem key={line.id} value={line.id}>
                                  {line.lineItem} ({currentProject.currency} {line.budgetAmount.toLocaleString()})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vendorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor</FormLabel>
                          <Select value={field.value || "none"} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select vendor (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No vendor</SelectItem>
                              {vendors.map(vendor => (
                                <SelectItem key={vendor.id} value={vendor.id}>
                                  {vendor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the expense..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount ({currentProject.currency}) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0"
                              className="currency-input"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="UPI">UPI</SelectItem>
                              <SelectItem value="Card">Card</SelectItem>
                              <SelectItem value="Transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shootDayId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shoot Day</FormLabel>
                        <Select value={field.value || "none"} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select shoot day (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No specific shoot day</SelectItem>
                            {shootDays.map(day => (
                              <SelectItem key={day.id} value={day.id}>
                                {new Date(day.date).toLocaleDateString()} - {day.location || 'No location'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reimbursable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            This is a reimbursable expense
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Check this if the expense should be reimbursed
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button variant="outline" type="button" asChild>
                      <a href="/expenses">Cancel</a>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add Expense"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-lg">Quick Amounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {quickAmounts.map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue('amount', amount)}
                    className="justify-start"
                  >
                    {currentProject.currency} {amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-lg">Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>• Link expenses to budget line items for better tracking</p>
              <p>• Add vendor information for payment processing</p>
              <p>• Associate with shoot days for location-based reporting</p>
              <p>• Mark reimbursable expenses for easy identification</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddExpense;