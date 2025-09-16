import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  PlusCircle, 
  Package, 
  Edit, 
  Trash2,
  Camera,
  Mic,
  Lightbulb,
  Wrench,
  Monitor,
  Headphones,
  Zap,
  Settings
} from "lucide-react";
import { storage } from "@/lib/storage";
import { toast } from "@/components/ui/use-toast";
import type { Project, Prop, Vendor } from "@/lib/types";

const Props = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [props, setProps] = useState<Prop[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProp, setEditingProp] = useState<Prop | null>(null);
  const [newProp, setNewProp] = useState({
    name: "",
    category: "",
    serialNo: "",
    ownerVendorId: "",
    notes: ""
  });

  const categoryIcons: { [key: string]: any } = {
    "Camera": Camera,
    "Audio": Mic,
    "Lighting": Lightbulb,
    "Support": Wrench,
    "Monitor": Monitor,
    "Accessories": Headphones,
    "Electrical": Zap,
    "Other": Package
  };

  useEffect(() => {
    const projectId = storage.getCurrentProject();
    if (projectId) {
      const project = storage.getProject(projectId);
      setCurrentProject(project);
      const projectProps = storage.getProps(projectId);
      setProps(projectProps);
      const allVendors = storage.getVendors();
      setVendors(allVendors);
    }
  }, []);

  const handleCreateProp = () => {
    if (!currentProject || !newProp.name) {
      toast({
        title: "Validation Error",
        description: "Please fill in the prop name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const prop = storage.addProp({
        projectId: currentProject.id,
        name: newProp.name,
        category: newProp.category || undefined,
        serialNo: newProp.serialNo || undefined,
        ownerVendorId: newProp.ownerVendorId || undefined,
        notes: newProp.notes || undefined,
      });

      setProps(prev => [...prev, prop]);
      setNewProp({ name: "", category: "", serialNo: "", ownerVendorId: "", notes: "" });
      setShowCreateDialog(false);

      toast({
        title: "Prop added",
        description: `Successfully added ${newProp.name} to the props list`,
      });
    } catch (error) {
      console.error("Error creating prop:", error);
      toast({
        title: "Error",
        description: "Failed to add prop. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProp = () => {
    if (!editingProp) return;

    try {
      const updatedProp = storage.updateProp(editingProp.id, {
        name: newProp.name,
        category: newProp.category || undefined,
        serialNo: newProp.serialNo || undefined,
        ownerVendorId: newProp.ownerVendorId || undefined,
        notes: newProp.notes || undefined,
      });

      if (updatedProp) {
        setProps(prev => prev.map(prop => prop.id === editingProp.id ? updatedProp : prop));
        setEditingProp(null);
        setNewProp({ name: "", category: "", serialNo: "", ownerVendorId: "", notes: "" });

        toast({
          title: "Prop updated",
          description: `Successfully updated ${updatedProp.name}`,
        });
      }
    } catch (error) {
      console.error("Error updating prop:", error);
      toast({
        title: "Error",
        description: "Failed to update prop. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProp = (id: string) => {
    if (window.confirm("Are you sure you want to remove this prop? This action cannot be undone.")) {
      try {
        storage.deleteProp(id);
        setProps(prev => prev.filter(prop => prop.id !== id));
        toast({
          title: "Prop removed",
          description: "Prop has been removed from the project.",
        });
      } catch (error) {
        console.error("Error deleting prop:", error);
        toast({
          title: "Error",
          description: "Failed to remove prop. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditProp = (prop: Prop) => {
    setEditingProp(prop);
    setNewProp({
      name: prop.name,
      category: prop.category || "",
      serialNo: prop.serialNo || "",
      ownerVendorId: prop.ownerVendorId || "",
      notes: prop.notes || ""
    });
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category] || Package;
    return <IconComponent className="h-4 w-4" />;
  };

  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor ? vendor.name : "Unknown Vendor";
  };

  if (!currentProject) {
    return <div className="text-center py-8">Please select a project to manage props.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Props & Equipment</h2>
          <p className="text-muted-foreground">
            Manage props and equipment for {currentProject.title}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <PlusCircle className="h-4 w-4" />
              <span>Add Prop</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Prop/Equipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newProp.name}
                  onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
                  placeholder="e.g., Canon EOS R5, Rode Microphone"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newProp.category}
                  onValueChange={(value) => setNewProp({ ...newProp, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Camera">Camera</SelectItem>
                    <SelectItem value="Audio">Audio</SelectItem>
                    <SelectItem value="Lighting">Lighting</SelectItem>
                    <SelectItem value="Support">Support</SelectItem>
                    <SelectItem value="Monitor">Monitor</SelectItem>
                    <SelectItem value="Accessories">Accessories</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="serialNo">Serial Number</Label>
                <Input
                  id="serialNo"
                  value={newProp.serialNo}
                  onChange={(e) => setNewProp({ ...newProp, serialNo: e.target.value })}
                  placeholder="e.g., CN001, RD001"
                />
              </div>
              <div>
                <Label htmlFor="ownerVendorId">Owner/Vendor</Label>
                <Select
                  value={newProp.ownerVendorId}
                  onValueChange={(value) => setNewProp({ ...newProp, ownerVendorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
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
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newProp.notes}
                  onChange={(e) => setNewProp({ ...newProp, notes: e.target.value })}
                  placeholder="Additional notes about this prop..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProp}>
                Add Prop
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {props.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Props/Equipment"
          description="Add props and equipment to start tracking your production assets."
          action={
            <Button onClick={() => setShowCreateDialog(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Prop
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {props.map((prop) => (
            <Card key={prop.id} className="shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {getCategoryIcon(prop.category || "Other")}
                    <span>{prop.name}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProp(prop)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProp(prop.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {prop.category && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        {getCategoryIcon(prop.category)}
                        <span>{prop.category}</span>
                      </Badge>
                    </div>
                  )}
                  {prop.serialNo && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Serial:</span> {prop.serialNo}
                    </div>
                  )}
                  {prop.ownerVendorId && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Owner:</span> {getVendorName(prop.ownerVendorId)}
                    </div>
                  )}
                  {prop.notes && (
                    <div className="text-sm text-muted-foreground">
                      {prop.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProp} onOpenChange={() => setEditingProp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Prop/Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={newProp.name}
                onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
                placeholder="e.g., Canon EOS R5, Rode Microphone"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={newProp.category}
                onValueChange={(value) => setNewProp({ ...newProp, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Camera">Camera</SelectItem>
                  <SelectItem value="Audio">Audio</SelectItem>
                  <SelectItem value="Lighting">Lighting</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="Monitor">Monitor</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-serialNo">Serial Number</Label>
              <Input
                id="edit-serialNo"
                value={newProp.serialNo}
                onChange={(e) => setNewProp({ ...newProp, serialNo: e.target.value })}
                placeholder="e.g., CN001, RD001"
              />
            </div>
            <div>
              <Label htmlFor="edit-ownerVendorId">Owner/Vendor</Label>
              <Select
                value={newProp.ownerVendorId}
                onValueChange={(value) => setNewProp({ ...newProp, ownerVendorId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
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
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={newProp.notes}
                onChange={(e) => setNewProp({ ...newProp, notes: e.target.value })}
                placeholder="Additional notes about this prop..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProp(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProp}>
              Update Prop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Props;
