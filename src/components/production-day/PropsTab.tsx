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
  Package, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Save,
  Edit,
  Trash2,
  Camera,
  Calendar,
  User
} from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import type { Prop, PropCheckout, Vendor } from "@/lib/types";

interface PropsTabProps {
  shootDayId: string;
  projectId: string;
  isLocked: boolean;
  onDataChange: () => void;
}

const PropsTab = ({ shootDayId, projectId, isLocked, onDataChange }: PropsTabProps) => {
  const { toast } = useToast();
  const [props, setProps] = useState<Prop[]>([]);
  const [checkouts, setCheckouts] = useState<PropCheckout[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [editingCheckout, setEditingCheckout] = useState<PropCheckout | null>(null);
  const [returningCheckout, setReturningCheckout] = useState<PropCheckout | null>(null);
  const [formData, setFormData] = useState({
    propId: "",
    checkedOutBy: "",
    dueReturn: "",
    checkoutCondition: "",
    notes: "",
  });
  const [returnData, setReturnData] = useState({
    returnCondition: "",
    returnNotes: "",
  });

  useEffect(() => {
    loadData();
  }, [shootDayId, projectId]);

  const loadData = () => {
    const projectProps = storage.getProps(projectId);
    setProps(projectProps);
    
    const dayCheckouts = storage.getPropCheckouts(shootDayId);
    setCheckouts(dayCheckouts);
    
    const allVendors = storage.getVendors();
    setVendors(allVendors);
  };

  const resetForm = () => {
    setFormData({
      propId: "",
      checkedOutBy: "",
      dueReturn: "",
      checkoutCondition: "",
      notes: "",
    });
    setEditingCheckout(null);
  };

  const resetReturnForm = () => {
    setReturnData({
      returnCondition: "",
      returnNotes: "",
    });
    setReturningCheckout(null);
  };

  const handleOpenDialog = (checkout?: PropCheckout) => {
    if (checkout) {
      setEditingCheckout(checkout);
      setFormData({
        propId: checkout.propId,
        checkedOutBy: checkout.checkedOutBy,
        dueReturn: checkout.dueReturn,
        checkoutCondition: checkout.checkoutCondition || "",
        notes: "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleOpenReturnDialog = (checkout: PropCheckout) => {
    setReturningCheckout(checkout);
    setReturnData({
      returnCondition: checkout.returnCondition || "",
      returnNotes: "",
    });
    setIsReturnDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.propId || !formData.checkedOutBy || !formData.dueReturn) {
      toast({
        title: "Validation Error",
        description: "Prop, checked out by, and due return date are required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const checkoutData = {
        propId: formData.propId,
        shootDayId,
        checkedOutBy: formData.checkedOutBy,
        dueReturn: formData.dueReturn,
        checkoutCondition: formData.checkoutCondition,
        notes: formData.notes,
      };

      if (editingCheckout) {
        storage.updatePropCheckout(editingCheckout.id, checkoutData);
        toast({
          title: "Checkout Updated",
          description: "The prop checkout has been updated successfully.",
        });
      } else {
        storage.addPropCheckout(checkoutData);
        toast({
          title: "Prop Checked Out",
          description: "The prop has been checked out successfully.",
        });
      }
      
      loadData();
      onDataChange();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save prop checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReturn = () => {
    if (!returningCheckout || !returnData.returnCondition) {
      toast({
        title: "Validation Error",
        description: "Return condition is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      storage.updatePropCheckout(returningCheckout.id, {
        status: 'returned',
        returnedAt: new Date().toISOString(),
        returnCondition: returnData.returnCondition,
        notes: returnData.returnNotes,
      });
      
      toast({
        title: "Prop Returned",
        description: "The prop has been returned successfully.",
      });
      
      loadData();
      onDataChange();
      setIsReturnDialogOpen(false);
      resetReturnForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to return prop. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    if (isLocked) return;
    
    // Note: We don't have a delete method in storage, so we'll skip this for now
    toast({
      title: "Feature Not Available",
      description: "Prop checkout deletion is not available in this version.",
      variant: "destructive",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'returned':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'returned':
        return "bg-success/10 text-success border-success/20";
      case 'overdue':
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-warning/10 text-warning border-warning/20";
    }
  };

  const getPropName = (propId: string) => {
    const prop = props.find(p => p.id === propId);
    return prop ? prop.name : 'Unknown Prop';
  };

  const getPropCategory = (propId: string) => {
    const prop = props.find(p => p.id === propId);
    return prop ? prop.category : '';
  };

  const getVendorName = (propId: string) => {
    const prop = props.find(p => p.id === propId);
    if (!prop || !prop.ownerVendorId) return '';
    const vendor = vendors.find(v => v.id === prop.ownerVendorId);
    return vendor ? vendor.name : '';
  };

  const isOverdue = (dueReturn: string) => {
    const dueDate = new Date(dueReturn);
    const today = new Date();
    return dueDate < today;
  };

  const getDaysOverdue = (dueReturn: string) => {
    const dueDate = new Date(dueReturn);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalProps = checkouts.length;
  const checkedOut = checkouts.filter(c => c.status === 'out').length;
  const returned = checkouts.filter(c => c.status === 'returned').length;
  const overdue = checkouts.filter(c => c.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Props & Rentals</h3>
          <p className="text-sm text-muted-foreground">
            {totalProps} props • {checkedOut} checked out • {overdue} overdue
          </p>
        </div>
        {!isLocked && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Check Out Prop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCheckout ? 'Edit Prop Checkout' : 'Check Out Prop'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prop">Prop *</Label>
                  <Select
                    value={formData.propId}
                    onValueChange={(value) => setFormData({ ...formData, propId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select prop..." />
                    </SelectTrigger>
                    <SelectContent>
                      {props.map(prop => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.name} {prop.category && `(${prop.category})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkedOutBy">Checked Out By *</Label>
                    <Input
                      id="checkedOutBy"
                      value={formData.checkedOutBy}
                      onChange={(e) => setFormData({ ...formData, checkedOutBy: e.target.value })}
                      placeholder="Person's name..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueReturn">Due Return Date *</Label>
                    <Input
                      id="dueReturn"
                      type="date"
                      value={formData.dueReturn}
                      onChange={(e) => setFormData({ ...formData, dueReturn: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="checkoutCondition">Checkout Condition</Label>
                  <Textarea
                    id="checkoutCondition"
                    value={formData.checkoutCondition}
                    onChange={(e) => setFormData({ ...formData, checkoutCondition: e.target.value })}
                    placeholder="Describe the condition of the prop when checked out..."
                    rows={2}
                  />
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
                    {editingCheckout ? 'Update' : 'Check Out'} Prop
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Props</p>
                <p className="text-2xl font-bold">{totalProps}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Checked Out</p>
                <p className="text-2xl font-bold text-warning">{checkedOut}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Returned</p>
                <p className="text-2xl font-bold text-success">{returned}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Props List */}
      <div className="space-y-3">
        {checkouts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Props Checked Out</h3>
              <p className="text-muted-foreground mb-4">
                Start by checking out props for this production day.
              </p>
              {!isLocked && (
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Check Out First Prop
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          checkouts.map((checkout) => {
            const propName = getPropName(checkout.propId);
            const propCategory = getPropCategory(checkout.propId);
            const vendorName = getVendorName(checkout.propId);
            const overdue = isOverdue(checkout.dueReturn);
            const daysOverdue = overdue ? getDaysOverdue(checkout.dueReturn) : 0;

            return (
              <Card key={checkout.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(checkout.status)}
                          <span className="font-medium">{propName}</span>
                          {propCategory && (
                            <Badge variant="outline" className="text-xs">
                              {propCategory}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className={getStatusColor(checkout.status)}>
                          {checkout.status}
                        </Badge>
                        {overdue && checkout.status !== 'returned' && (
                          <Badge variant="destructive" className="text-xs">
                            {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {checkout.checkedOutBy}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {new Date(checkout.dueReturn).toLocaleDateString()}
                        </div>
                        {vendorName && (
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {vendorName}
                          </div>
                        )}
                      </div>
                      
                      {checkout.checkoutCondition && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Checkout:</strong> {checkout.checkoutCondition}
                        </p>
                      )}
                      
                      {checkout.returnCondition && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Return:</strong> {checkout.returnCondition}
                        </p>
                      )}
                      
                      {checkout.returnedAt && (
                        <p className="text-xs text-muted-foreground">
                          Returned: {new Date(checkout.returnedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    {!isLocked && (
                      <div className="flex items-center gap-1">
                        {checkout.status === 'out' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReturnDialog(checkout)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Return
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(checkout)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(checkout.id)}
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

      {/* Return Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Prop</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {returningCheckout && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{getPropName(returningCheckout.propId)}</p>
                <p className="text-sm text-muted-foreground">
                  Checked out by: {returningCheckout.checkedOutBy}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="returnCondition">Return Condition *</Label>
              <Textarea
                id="returnCondition"
                value={returnData.returnCondition}
                onChange={(e) => setReturnData({ ...returnData, returnCondition: e.target.value })}
                placeholder="Describe the condition of the prop when returned..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="returnNotes">Return Notes</Label>
              <Textarea
                id="returnNotes"
                value={returnData.returnNotes}
                onChange={(e) => setReturnData({ ...returnData, returnNotes: e.target.value })}
                placeholder="Additional notes about the return..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReturn}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Return Prop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropsTab;

