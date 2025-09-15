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
import type { BudgetLine } from "@/lib/types";

const BudgetLineFormSchema = z.object({
  lineItem: z.string().min(1, "Line item is required"),
  budgetAmount: z.number().min(0, "Budget amount must be positive"),
});

type BudgetLineFormData = z.infer<typeof BudgetLineFormSchema>;

interface BudgetLineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  departmentId: string;
  budgetLine?: BudgetLine;
  onSuccess?: (budgetLine: BudgetLine) => void;
}

export const BudgetLineForm = ({ 
  open, 
  onOpenChange, 
  projectId, 
  departmentId,
  budgetLine, 
  onSuccess 
}: BudgetLineFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<BudgetLineFormData>({
    resolver: zodResolver(BudgetLineFormSchema),
    defaultValues: {
      lineItem: budgetLine?.lineItem || "",
      budgetAmount: budgetLine?.budgetAmount || 0,
    },
  });

  const onSubmit = async (values: BudgetLineFormData) => {
    setIsSubmitting(true);

    try {
      let savedBudgetLine: BudgetLine;

      if (budgetLine) {
        savedBudgetLine = storage.updateBudgetLine(budgetLine.id, values);
        toast({
          title: "Budget line updated",
          description: "Budget line has been updated successfully.",
        });
      } else {
        savedBudgetLine = storage.addBudgetLine({
          ...values,
          projectId,
          departmentId,
        });
        toast({
          title: "Budget line created",
          description: "New budget line has been created successfully.",
        });
      }

      onSuccess?.(savedBudgetLine);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving budget line:", error);
      toast({
        title: "Error",
        description: "Failed to save budget line. Please try again.",
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
            {budgetLine ? "Edit Budget Line" : "Add New Budget Line"}
          </DialogTitle>
          <DialogDescription>
            {budgetLine 
              ? "Update budget line item and allocation." 
              : "Create a new budget line item with allocation."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lineItem">Line Item *</Label>
            <Input
              id="lineItem"
              {...form.register("lineItem")}
              placeholder="e.g., Camera Equipment, Catering"
              className={form.formState.errors.lineItem ? "border-destructive" : ""}
            />
            {form.formState.errors.lineItem && (
              <p className="text-sm text-destructive">{form.formState.errors.lineItem.message}</p>
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
              {isSubmitting ? "Saving..." : budgetLine ? "Update Line" : "Create Line"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};