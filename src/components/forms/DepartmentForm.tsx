import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import type { Department } from "@/lib/types";

const DepartmentFormSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  budgetAmount: z.number().min(0, "Budget amount must be positive"),
});

type DepartmentFormData = z.infer<typeof DepartmentFormSchema>;

interface DepartmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  department?: Department;
  onSuccess?: (department: Department) => void;
}

export const DepartmentForm = ({ 
  open, 
  onOpenChange, 
  projectId, 
  department, 
  onSuccess 
}: DepartmentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(DepartmentFormSchema),
    defaultValues: {
      name: department?.name || "",
      budgetAmount: department?.budgetAmount || 0,
    },
  });

  const onSubmit = async (values: DepartmentFormData) => {
    setIsSubmitting(true);

    try {
      let savedDepartment: Department;

      if (department) {
        savedDepartment = storage.updateDepartment(department.id, values);
        toast({
          title: "Department updated",
          description: "Department has been updated successfully.",
        });
      } else {
        savedDepartment = storage.addDepartment({
          ...values,
          projectId,
        });
        toast({
          title: "Department created",
          description: "New department has been created successfully.",
        });
      }

      onSuccess?.(savedDepartment);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving department:", error);
      toast({
        title: "Error",
        description: "Failed to save department. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {department ? "Edit Department" : "Add New Department"}
          </DialogTitle>
          <DialogDescription>
            {department 
              ? "Update department information and budget allocation." 
              : "Create a new department with budget allocation."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="e.g., Production, Post-Production"
              className={form.formState.errors.name ? "border-destructive" : ""}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budgetAmount">Budget Amount *</Label>
            <Input
              id="budgetAmount"
              type="number"
              step="0.01"
              min="0"
              {...form.register("budgetAmount", { valueAsNumber: true })}
              placeholder="Enter budget amount"
              className={form.formState.errors.budgetAmount ? "border-destructive" : ""}
            />
            {form.formState.errors.budgetAmount && (
              <p className="text-sm text-destructive">{form.formState.errors.budgetAmount.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : department ? "Update Department" : "Create Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};