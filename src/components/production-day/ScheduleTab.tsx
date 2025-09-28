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
  Clock, 
  Users, 
  CheckCircle, 
  Circle, 
  XCircle, 
  PlayCircle,
  Edit,
  Trash2,
  Save,
  Calendar
} from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import type { ScheduleItem, Crew } from "@/lib/types";

interface ScheduleTabProps {
  shootDayId: string;
  isLocked: boolean;
  onDataChange: () => void;
}

const ScheduleTab = ({ shootDayId, isLocked, onDataChange }: ScheduleTabProps) => {
  const { toast } = useToast();
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [crew, setCrew] = useState<Crew[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [formData, setFormData] = useState({
    scene: "",
    shot: "",
    description: "",
    plannedStart: "",
    plannedEnd: "",
    actualStart: "",
    actualEnd: "",
    assignees: [] as string[],
    status: "planned" as "planned" | "in_progress" | "done" | "dropped",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [shootDayId]);

  const loadData = () => {
    const items = storage.getScheduleItems(shootDayId);
    setScheduleItems(items);
    
    // Get crew from the project
    const shootDay = storage.getShootDayExtended(shootDayId);
    if (shootDay) {
      const projectCrew = storage.getCrew(shootDay.projectId);
      setCrew(projectCrew);
    }
  };

  const resetForm = () => {
    setFormData({
      scene: "",
      shot: "",
      description: "",
      plannedStart: "",
      plannedEnd: "",
      actualStart: "",
      actualEnd: "",
      assignees: [],
      status: "planned",
      notes: "",
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: ScheduleItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        scene: item.scene,
        shot: item.shot,
        description: item.description || "",
        plannedStart: item.plannedStart || "",
        plannedEnd: item.plannedEnd || "",
        actualStart: item.actualStart || "",
        actualEnd: item.actualEnd || "",
        assignees: item.assignees,
        status: item.status as "planned" | "in_progress" | "done" | "dropped",
        notes: item.notes || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.scene || !formData.shot) {
      toast({
        title: "Validation Error",
        description: "Scene and Shot are required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        storage.updateScheduleItem(editingItem.id, formData);
        toast({
          title: "Schedule Item Updated",
          description: "The schedule item has been updated successfully.",
        });
      } else {
        storage.addScheduleItem({
          ...formData,
          shootDayId,
        });
        toast({
          title: "Schedule Item Added",
          description: "The schedule item has been added successfully.",
        });
      }
      
      loadData();
      onDataChange();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save schedule item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    if (isLocked) return;
    
    storage.deleteScheduleItem(id);
    loadData();
    onDataChange();
    toast({
      title: "Schedule Item Deleted",
      description: "The schedule item has been deleted successfully.",
    });
  };

  const handleStatusChange = (id: string, newStatus: ScheduleItem['status']) => {
    if (isLocked) return;
    
    storage.updateScheduleItem(id, { status: newStatus });
    loadData();
    onDataChange();
  };

  const getStatusIcon = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-warning" />;
      case 'dropped':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'done':
        return "bg-success/10 text-success border-success/20";
      case 'in_progress':
        return "bg-warning/10 text-warning border-warning/20";
      case 'dropped':
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const calculateProgress = () => {
    const total = scheduleItems.length;
    const completed = scheduleItems.filter(item => item.status === 'done').length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Schedule & Shots</h3>
          <p className="text-sm text-muted-foreground">
            {scheduleItems.length} items • {calculateProgress().toFixed(1)}% complete
          </p>
        </div>
        {!isLocked && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Shot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Schedule Item' : 'Add Schedule Item'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scene">Scene *</Label>
                    <Input
                      id="scene"
                      value={formData.scene}
                      onChange={(e) => setFormData({ ...formData, scene: e.target.value })}
                      placeholder="e.g., Scene 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shot">Shot *</Label>
                    <Input
                      id="shot"
                      value={formData.shot}
                      onChange={(e) => setFormData({ ...formData, shot: e.target.value })}
                      placeholder="e.g., Shot A"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the shot..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plannedStart">Planned Start</Label>
                    <Input
                      id="plannedStart"
                      type="time"
                      value={formData.plannedStart}
                      onChange={(e) => setFormData({ ...formData, plannedStart: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="plannedEnd">Planned End</Label>
                    <Input
                      id="plannedEnd"
                      type="time"
                      value={formData.plannedEnd}
                      onChange={(e) => setFormData({ ...formData, plannedEnd: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="actualStart">Actual Start</Label>
                    <Input
                      id="actualStart"
                      type="time"
                      value={formData.actualStart}
                      onChange={(e) => setFormData({ ...formData, actualStart: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="actualEnd">Actual End</Label>
                    <Input
                      id="actualEnd"
                      type="time"
                      value={formData.actualEnd}
                      onChange={(e) => setFormData({ ...formData, actualEnd: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Assignees</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !formData.assignees.includes(value)) {
                        setFormData({
                          ...formData,
                          assignees: [...formData.assignees, value]
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add crew member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {crew.map(member => (
                        <SelectItem key={member.id} value={member.name}>
                          {member.name} ({member.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.assignees.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.assignees.map((assignee, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {assignee}
                          <button
                            onClick={() => {
                              setFormData({
                                ...formData,
                                assignees: formData.assignees.filter((_, i) => i !== index)
                              });
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "planned" | "in_progress" | "done" | "dropped") => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="dropped">Dropped</SelectItem>
                    </SelectContent>
                  </Select>
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
                    {editingItem ? 'Update' : 'Add'} Item
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Schedule Items List */}
      <div className="space-y-3">
        {scheduleItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Schedule Items</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding scenes and shots for this production day.
              </p>
              {!isLocked && (
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Shot
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          scheduleItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="font-medium">{item.scene} - {item.shot}</span>
                      </div>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {item.plannedStart && item.plannedEnd && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Planned: {item.plannedStart} - {item.plannedEnd}
                        </div>
                      )}
                      {item.actualStart && item.actualEnd && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Actual: {item.actualStart} - {item.actualEnd}
                        </div>
                      )}
                      {item.assignees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {item.assignees.join(', ')}
                        </div>
                      )}
                    </div>
                    
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                  
                  {!isLocked && (
                    <div className="flex items-center gap-1">
                      <Select
                        value={item.status}
                        onValueChange={(value: ScheduleItem['status']) => 
                          handleStatusChange(item.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="dropped">Dropped</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ScheduleTab;
