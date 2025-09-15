import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Vendor } from "@/lib/types";

const VendorFormSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  gstin: z.string().optional(),
  contacts: z.string().optional(),
});

type VendorFormData = z.infer<typeof VendorFormSchema>;

interface VendorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor;
  onSuccess?: (vendor: Vendor) => void;
}

export const VendorForm = ({ open, onOpenChange, vendor, onSuccess }: VendorFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<VendorFormData>({
    resolver: zodResolver(VendorFormSchema),
    defaultValues: {
      name: vendor?.name || "",
      gstin: vendor?.gstin || "",
      contacts: vendor?.contacts?.join(", ") || "",
    },
  });

  const onSubmit = async (values: VendorFormData) => {
    setIsSubmitting(true);

    try {
      const contacts = values.contacts 
        ? values.contacts.split(",").map(c => c.trim()).filter(Boolean)
        : [];

      let savedVendor: Vendor;

      if (vendor) {
        savedVendor = storage.updateVendor(vendor.id, {
          name: values.name,
          gstin: values.gstin || undefined,
          contacts,
        });
        toast({
          title: "Vendor updated",
          description: "Vendor information has been updated successfully.",
        });
      } else {
        savedVendor = storage.addVendor({
          name: values.name,
          gstin: values.gstin || undefined,
          contacts,
        });
        toast({
          title: "Vendor created",
          description: "New vendor has been created successfully.",
        });
      }

      onSuccess?.(savedVendor);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast({
        title: "Error",
        description: "Failed to save vendor. Please try again.",
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
          <DialogTitle>{vendor ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
          <DialogDescription>
            {vendor ? "Update vendor information." : "Create a new vendor for your project."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vendor Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter vendor name"
              className={form.formState.errors.name ? "border-destructive" : ""}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN (Optional)</Label>
            <Input
              id="gstin"
              {...form.register("gstin")}
              placeholder="Enter GSTIN number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contacts">Contact Numbers (Optional)</Label>
            <Textarea
              id="contacts"
              {...form.register("contacts")}
              placeholder="Enter contact numbers (comma separated)"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple contacts with commas
            </p>
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
              {isSubmitting ? "Saving..." : vendor ? "Update Vendor" : "Create Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};