import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { VarianceChip } from "@/components/ui/variance-chip";
import { DepartmentForm } from "@/components/forms/DepartmentForm";
import { BudgetLineForm } from "@/components/forms/BudgetLineForm";
import { 
  Plus, 
  FolderOpen, 
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { analytics } from "@/lib/analytics";
import type { Department, BudgetLine, Project, DepartmentSummary } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ProjectBudget = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [departmentSummaries, setDepartmentSummaries] = useState<DepartmentSummary[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [showBudgetLineForm, setShowBudgetLineForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | undefined>();
  const [editingBudgetLine, setEditingBudgetLine] = useState<BudgetLine | undefined>();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [deletingDepartment, setDeletingDepartment] = useState<Department | undefined>();
  const [deletingBudgetLine, setDeletingBudgetLine] = useState<BudgetLine | undefined>();

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    storage.initialize();
    const currentProjectId = storage.getCurrentProject();
    
    if (currentProjectId) {
      const project = storage.getProject(currentProjectId);
      setCurrentProject(project);
      
      const projectDepartments = storage.getDepartments(currentProjectId);
      setDepartments(projectDepartments);
      
      const projectBudgetLines = storage.getBudgetLines(currentProjectId);
      setBudgetLines(projectBudgetLines);
      
      // Calculate summaries
      const summary = analytics.getProjectSummary(currentProjectId);
      setDepartmentSummaries(summary.departmentSummaries);
      
      // Expand departments with content by default
      const departmentsWithLines = new Set(
        projectBudgetLines.map(line => line.departmentId)
      );
      setExpandedDepartments(departmentsWithLines);
    }
  };

  const handleDepartmentSuccess = () => {
    loadData();
    setEditingDepartment(undefined);
  };

  const handleBudgetLineSuccess = () => {
    loadData();
    setEditingBudgetLine(undefined);
    setSelectedDepartmentId("");
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setShowDepartmentForm(true);
  };

  const handleAddBudgetLine = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setShowBudgetLineForm(true);
  };

  const handleEditBudgetLine = (budgetLine: BudgetLine) => {
    setEditingBudgetLine(budgetLine);
    setSelectedDepartmentId(budgetLine.departmentId);
    setShowBudgetLineForm(true);
  };

  const toggleDepartment = (departmentId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  const handleDeleteDepartment = async (department: Department) => {
    try {
      // Check if department has budget lines
      const departmentLines = budgetLines.filter(line => line.departmentId === department.id);
      if (departmentLines.length > 0) {
        toast({
          title: "Cannot delete department",
          description: "Department has budget lines. Delete all budget lines first.",
          variant: "destructive",
        });
        return;
      }

      storage.deleteDepartment(department.id);
      toast({
        title: "Department deleted",
        description: `${department.name} has been deleted successfully.`,
      });
      loadData();
      setDeletingDepartment(undefined);
    } catch (error) {
      console.error("Error deleting department:", error);
      toast({
        title: "Error",
        description: "Failed to delete department. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBudgetLine = async (budgetLine: BudgetLine) => {
    try {
      storage.deleteBudgetLine(budgetLine.id);
      toast({
        title: "Budget line deleted",
        description: `${budgetLine.lineItem} has been deleted successfully.`,
      });
      loadData();
      setDeletingBudgetLine(undefined);
    } catch (error) {
      console.error("Error deleting budget line:", error);
      toast({
        title: "Error",
        description: "Failed to delete budget line. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!currentProject) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No project selected"
        description="Please create or select a project to manage budgets."
        onAction={() => window.location.href = "/project/new"}
        actionLabel="Create Project"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold gradient-hero bg-clip-text text-transparent">
            Budget Editor
          </h1>
          <p className="text-muted-foreground">
            Manage departments and budget allocations for {currentProject.title}
          </p>
        </div>
        <Button onClick={() => setShowDepartmentForm(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Departments List */}
      {departments.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No departments yet"
          description="Start by creating departments to organize your budget."
          onAction={() => setShowDepartmentForm(true)}
          actionLabel="Add First Department"
        />
      ) : (
        <div className="space-y-4">
          {departments.map((department) => {
            const summary = departmentSummaries.find(s => s.departmentId === department.id);
            const departmentBudgetLines = budgetLines.filter(line => line.departmentId === department.id);
            const isExpanded = expandedDepartments.has(department.id);

            return (
              <Card key={department.id} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleDepartment(department.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger className="flex items-center space-x-3 flex-1 text-left">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-lg">{department.name}</CardTitle>
                          <div className="flex items-center space-x-4 mt-1">
                            <Badge variant="outline">
                              Budget: {currentProject.currency} {department.budgetAmount.toLocaleString()}
                            </Badge>
                            {summary && (
                              <VarianceChip
                                variance={summary.variance}
                                percentage={summary.variancePercent}
                                currency={currentProject.currency === "INR" ? "₹" : currentProject.currency}
                              />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddBudgetLine(department.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Line
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDepartment(department)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingDepartment(department)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {departmentBudgetLines.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No budget lines yet</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleAddBudgetLine(department.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Line Item
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {departmentBudgetLines.map((line) => (
                            <div
                              key={line.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                            >
                              <div className="flex-1">
                                <div className="font-medium">{line.lineItem}</div>
                                <div className="text-sm text-muted-foreground">
                                  {currentProject.currency} {line.budgetAmount.toLocaleString()}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditBudgetLine(line)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingBudgetLine(line)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Forms and Dialogs */}
      <DepartmentForm
        open={showDepartmentForm}
        onOpenChange={(open) => {
          setShowDepartmentForm(open);
          if (!open) setEditingDepartment(undefined);
        }}
        projectId={currentProject.id}
        department={editingDepartment}
        onSuccess={handleDepartmentSuccess}
      />

      <BudgetLineForm
        open={showBudgetLineForm}
        onOpenChange={(open) => {
          setShowBudgetLineForm(open);
          if (!open) {
            setEditingBudgetLine(undefined);
            setSelectedDepartmentId("");
          }
        }}
        projectId={currentProject.id}
        departmentId={selectedDepartmentId}
        budgetLine={editingBudgetLine}
        onSuccess={handleBudgetLineSuccess}
      />

      {/* Delete Dialogs */}
      <AlertDialog 
        open={!!deletingDepartment} 
        onOpenChange={() => setDeletingDepartment(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingDepartment?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingDepartment && handleDeleteDepartment(deletingDepartment)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={!!deletingBudgetLine} 
        onOpenChange={() => setDeletingBudgetLine(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget Line</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBudgetLine?.lineItem}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingBudgetLine && handleDeleteBudgetLine(deletingBudgetLine)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectBudget;