import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { VendorForm } from "@/components/forms/VendorForm";
import { 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  FileText,
  Edit,
  Trash2
} from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import type { Vendor } from "@/lib/types";
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

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | undefined>();
  const [deletingVendor, setDeletingVendor] = useState<Vendor | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [vendors, searchTerm]);

  const loadVendors = () => {
    const allVendors = storage.getVendors();
    setVendors(allVendors);
  };

  const filterVendors = () => {
    if (!searchTerm) {
      setFilteredVendors(vendors);
      return;
    }

    const filtered = vendors.filter(vendor =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.gstin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contacts.some(contact => contact.includes(searchTerm))
    );
    setFilteredVendors(filtered);
  };

  const handleVendorSuccess = () => {
    loadVendors();
    setEditingVendor(undefined);
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setShowVendorForm(true);
  };

  const handleDelete = async (vendor: Vendor) => {
    try {
      storage.deleteVendor(vendor.id);
      toast({
        title: "Vendor deleted",
        description: `${vendor.name} has been deleted successfully.`,
      });
      loadVendors();
      setDeletingVendor(undefined);
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast({
        title: "Error",
        description: "Failed to delete vendor. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold gradient-hero bg-clip-text text-transparent">
            Vendor Management
          </h1>
          <p className="text-muted-foreground">
            Manage your project vendors and contact information
          </p>
        </div>
        <Button onClick={() => setShowVendorForm(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors by name, GSTIN, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      {filteredVendors.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchTerm ? "No vendors found" : "No vendors yet"}
          description={
            searchTerm 
              ? "Try adjusting your search terms to find vendors."
              : "Start by adding your first vendor to track expenses efficiently."
          }
          onAction={!searchTerm ? () => setShowVendorForm(true) : undefined}
          actionLabel={!searchTerm ? "Add First Vendor" : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="hover:shadow-medium transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{vendor.name}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(vendor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingVendor(vendor)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {vendor.gstin && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{vendor.gstin}</span>
                  </div>
                )}
                
                {vendor.contacts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Contacts:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {vendor.contacts.map((contact, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {contact}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {!vendor.gstin && vendor.contacts.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No additional details
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Forms and Dialogs */}
      <VendorForm
        open={showVendorForm}
        onOpenChange={(open) => {
          setShowVendorForm(open);
          if (!open) setEditingVendor(undefined);
        }}
        vendor={editingVendor}
        onSuccess={handleVendorSuccess}
      />

      <AlertDialog 
        open={!!deletingVendor} 
        onOpenChange={() => setDeletingVendor(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingVendor?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingVendor && handleDelete(deletingVendor)}
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

export default Vendors;