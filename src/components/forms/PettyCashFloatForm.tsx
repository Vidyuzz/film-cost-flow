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
import type { PettyCashFloat } from "@/lib/types";

const PettyCashFloatFormSchema = z.object({
  ownerUserId: z.string().min(1, "Owner name is required"),
  issuedAmount: z.number().min(1, "Amount must be greater than 0"),
});

type PettyCashFloatFormData = z.infer<typeof PettyCashFloatFormSchema>;

interface PettyCashFloatFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: (float: PettyCashFloat) => void;
}

export const PettyCashFloatForm = ({ 
  open, 
  onOpenChange, 
  projectId, 
  onSuccess 
}: PettyCashFloatFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PettyCashFloatFormData>({
    resolver: zodResolver(PettyCashFloatFormSchema),
    defaultValues: {
      ownerUserId: "",
      issuedAmount: 0,
    },
  });

  const onSubmit = async (values: PettyCashFloatFormData) => {
    setIsSubmitting(true);

    try {
      const newFloat = storage.addPettyCashFloat({
        ...values,
        projectId,
        issuedAt: new Date().toISOString(),
        balance: values.issuedAmount, // Initial balance equals issued amount
      });

      toast({
        title: "Petty cash float created",
        description: `Float of ₹${values.issuedAmount.toLocaleString()} issued to ${values.ownerUserId}.`,
      });

      onSuccess?.(newFloat);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error creating petty cash float:", error);
      toast({
        title: "Error",
        description: "Failed to create petty cash float. Please try again.",
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
          <DialogTitle>Issue New Petty Cash Float</DialogTitle>
          <DialogDescription>
            Create a new petty cash float and assign it to a team member.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ownerUserId">Assigned To *</Label>
            <Input
              id="ownerUserId"
              {...form.register("ownerUserId")}
              placeholder="Enter name of person responsible"
              className={form.formState.errors.ownerUserId ? "border-destructive" : ""}
            />
            {form.formState.errors.ownerUserId && (
              <p className="text-sm text-destructive">{form.formState.errors.ownerUserId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuedAmount">Amount to Issue *</Label>
            <Input
              id="issuedAmount"
              type="number"
              step="0.01"
              min="1"
              {...form.register("issuedAmount", { valueAsNumber: true })}
              placeholder="Enter amount"
              className={form.formState.errors.issuedAmount ? "border-destructive" : ""}
            />
            {form.formState.errors.issuedAmount && (
              <p className="text-sm text-destructive">{form.formState.errors.issuedAmount.message}</p>
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
              {isSubmitting ? "Creating..." : "Issue Float"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};