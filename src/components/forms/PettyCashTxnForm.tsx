import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import type { PettyCashTxn, PettyCashFloat } from "@/lib/types";

const PettyCashTxnFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  type: z.enum(["debit", "credit"]),
});

type PettyCashTxnFormData = z.infer<typeof PettyCashTxnFormSchema>;

interface PettyCashTxnFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  float: PettyCashFloat;
  onSuccess?: (transaction: PettyCashTxn) => void;
}

export const PettyCashTxnForm = ({ 
  open, 
  onOpenChange, 
  float,
  onSuccess 
}: PettyCashTxnFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PettyCashTxnFormData>({
    resolver: zodResolver(PettyCashTxnFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: "",
      amount: 0,
      type: "debit",
    },
  });

  const selectedType = form.watch("type");

  const onSubmit = async (values: PettyCashTxnFormData) => {
    setIsSubmitting(true);

    try {
      // Check if transaction would make balance negative
      const newBalance = values.type === "debit" 
        ? float.balance - values.amount 
        : float.balance + values.amount;

      if (newBalance < 0) {
        toast({
          title: "Insufficient balance",
          description: `This transaction would result in a negative balance. Current balance: ₹${float.balance.toLocaleString()}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const newTransaction = storage.addPettyCashTxn({
        ...values,
        floatId: float.id,
      });

      // Update float balance
      storage.updatePettyCashFloat(float.id, { balance: newBalance });

      toast({
        title: "Transaction recorded",
        description: `${values.type === "debit" ? "Expense" : "Credit"} of ₹${values.amount.toLocaleString()} recorded successfully.`,
      });

      onSuccess?.(newTransaction);
      onOpenChange(false);
      form.reset({
        date: new Date().toISOString().split('T')[0],
        description: "",
        amount: 0,
        type: "debit",
      });
    } catch (error) {
      console.error("Error recording transaction:", error);
      toast({
        title: "Error",
        description: "Failed to record transaction. Please try again.",
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
          <DialogTitle>Record Transaction</DialogTitle>
          <DialogDescription>
            Record a petty cash transaction for {float.ownerUserId}. 
            Current balance: ₹{float.balance.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Transaction Type *</Label>
            <RadioGroup 
              value={selectedType} 
              onValueChange={(value) => form.setValue("type", value as "debit" | "credit")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="debit" id="debit" />
                <Label htmlFor="debit">Expense (Debit)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit" id="credit" />
                <Label htmlFor="credit">Top-up (Credit)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              {...form.register("date")}
              className={form.formState.errors.date ? "border-destructive" : ""}
            />
            {form.formState.errors.date && (
              <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              {...form.register("amount", { valueAsNumber: true })}
              placeholder="Enter amount"
              className={form.formState.errors.amount ? "border-destructive" : ""}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Enter transaction description"
              rows={3}
              className={form.formState.errors.description ? "border-destructive" : ""}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
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
              {isSubmitting ? "Recording..." : "Record Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};