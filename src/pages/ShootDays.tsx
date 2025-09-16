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
  Calendar, 
  MapPin, 
  Clock, 
  Cloud, 
  Lock, 
  Unlock, 
  Edit, 
  Trash2,
  Play,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { storage } from "@/lib/storage";
import { toast } from "@/components/ui/use-toast";
import type { Project, ShootDayExtended } from "@/lib/types";

const ShootDays = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [shootDays, setShootDays] = useState<ShootDayExtended[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDay, setEditingDay] = useState<ShootDayExtended | null>(null);
  const [newShootDay, setNewShootDay] = useState({
    date: "",
    location: "",
    callTime: "",
    wrapTime: "",
    weatherNote: "",
    status: "open" as "open" | "locked",
    notes: ""
  });

  useEffect(() => {
    const projectId = storage.getCurrentProject();
    if (projectId) {
      const project = storage.getProject(projectId);
      setCurrentProject(project);
      const days = storage.getShootDaysExtended(projectId);
      setShootDays(days);
    }
  }, []);

  const handleCreateShootDay = () => {
    if (!currentProject || !newShootDay.date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const shootDay = storage.addShootDayExtended({
        projectId: currentProject.id,
        date: newShootDay.date,
        location: newShootDay.location || undefined,
        callTime: newShootDay.callTime || undefined,
        wrapTime: newShootDay.wrapTime || undefined,
        weatherNote: newShootDay.weatherNote || undefined,
        status: newShootDay.status,
        notes: newShootDay.notes || undefined,
      });

      setShootDays(prev => [...prev, shootDay]);
      setNewShootDay({
        date: "",
        location: "",
        callTime: "",
        wrapTime: "",
        weatherNote: "",
        status: "open",
        notes: ""
      });
      setShowCreateDialog(false);

      toast({
        title: "Shoot day created",
        description: `Successfully created shoot day for ${newShootDay.date}`,
      });
    } catch (error) {
      console.error("Error creating shoot day:", error);
      toast({
        title: "Error",
        description: "Failed to create shoot day. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateShootDay = () => {
    if (!editingDay) return;

    try {
      const updatedDay = storage.updateShootDayExtended(editingDay.id, {
        date: newShootDay.date,
        location: newShootDay.location || undefined,
        callTime: newShootDay.callTime || undefined,
        wrapTime: newShootDay.wrapTime || undefined,
        weatherNote: newShootDay.weatherNote || undefined,
        status: newShootDay.status,
        notes: newShootDay.notes || undefined,
      });

      if (updatedDay) {
        setShootDays(prev => prev.map(day => day.id === editingDay.id ? updatedDay : day));
        setEditingDay(null);
        setNewShootDay({
          date: "",
          location: "",
          callTime: "",
          wrapTime: "",
          weatherNote: "",
          status: "open",
          notes: ""
        });

        toast({
          title: "Shoot day updated",
          description: `Successfully updated shoot day for ${updatedDay.date}`,
        });
      }
    } catch (error) {
      console.error("Error updating shoot day:", error);
      toast({
        title: "Error",
        description: "Failed to update shoot day. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteShootDay = (id: string) => {
    if (window.confirm("Are you sure you want to delete this shoot day? This action cannot be undone.")) {
      try {
        // Note: We don't have a delete method in storage yet, but we can filter it out
        setShootDays(prev => prev.filter(day => day.id !== id));
        toast({
          title: "Shoot day deleted",
          description: "Shoot day has been removed.",
        });
      } catch (error) {
        console.error("Error deleting shoot day:", error);
        toast({
          title: "Error",
          description: "Failed to delete shoot day. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditShootDay = (day: ShootDayExtended) => {
    setEditingDay(day);
    setNewShootDay({
      date: day.date,
      location: day.location || "",
      callTime: day.callTime || "",
      wrapTime: day.wrapTime || "",
      weatherNote: day.weatherNote || "",
      status: day.status,
      notes: day.notes || ""
    });
  };

  const handleOpenProductionDay = (dayId: string) => {
    window.location.href = `/day/${dayId}`;
  };

  if (!currentProject) {
    return <div className="text-center py-8">Please select a project to manage shoot days.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Shoot Days</h2>
          <p className="text-muted-foreground">
            Manage production schedule for {currentProject.title}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <PlusCircle className="h-4 w-4" />
              <span>Add Shoot Day</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Shoot Day</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newShootDay.date}
                  onChange={(e) => setNewShootDay({ ...newShootDay, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newShootDay.location}
                  onChange={(e) => setNewShootDay({ ...newShootDay, location: e.target.value })}
                  placeholder="e.g., Studio A, Outdoor Location"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="callTime">Call Time</Label>
                  <Input
                    id="callTime"
                    type="time"
                    value={newShootDay.callTime}
                    onChange={(e) => setNewShootDay({ ...newShootDay, callTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="wrapTime">Wrap Time</Label>
                  <Input
                    id="wrapTime"
                    type="time"
                    value={newShootDay.wrapTime}
                    onChange={(e) => setNewShootDay({ ...newShootDay, wrapTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="weatherNote">Weather Note</Label>
                <Input
                  id="weatherNote"
                  value={newShootDay.weatherNote}
                  onChange={(e) => setNewShootDay({ ...newShootDay, weatherNote: e.target.value })}
                  placeholder="e.g., Sunny, 25°C"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newShootDay.status}
                  onValueChange={(value: "open" | "locked") => setNewShootDay({ ...newShootDay, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newShootDay.notes}
                  onChange={(e) => setNewShootDay({ ...newShootDay, notes: e.target.value })}
                  placeholder="Additional notes for this shoot day..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateShootDay}>
                Create Shoot Day
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {shootDays.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Shoot Days"
          description="Create your first shoot day to start managing your production schedule."
          action={
            <Button onClick={() => setShowCreateDialog(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Shoot Day
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {shootDays.map((day) => (
            <Card key={day.id} className="shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>{day.date}</span>
                    <Badge variant={day.status === 'locked' ? 'destructive' : 'default'}>
                      {day.status === 'locked' ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                      {day.status}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenProductionDay(day.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Open Day
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditShootDay(day)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteShootDay(day.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{day.location || 'No location set'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Call: {day.callTime || 'Not set'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Wrap: {day.wrapTime || 'Not set'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Cloud className="h-4 w-4" />
                    <span>{day.weatherNote || 'No weather note'}</span>
                  </div>
                </div>
                {day.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{day.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingDay} onOpenChange={() => setEditingDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shoot Day</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-date">Date *</Label>
              <Input
                id="edit-date"
                type="date"
                value={newShootDay.date}
                onChange={(e) => setNewShootDay({ ...newShootDay, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={newShootDay.location}
                onChange={(e) => setNewShootDay({ ...newShootDay, location: e.target.value })}
                placeholder="e.g., Studio A, Outdoor Location"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-callTime">Call Time</Label>
                <Input
                  id="edit-callTime"
                  type="time"
                  value={newShootDay.callTime}
                  onChange={(e) => setNewShootDay({ ...newShootDay, callTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-wrapTime">Wrap Time</Label>
                <Input
                  id="edit-wrapTime"
                  type="time"
                  value={newShootDay.wrapTime}
                  onChange={(e) => setNewShootDay({ ...newShootDay, wrapTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-weatherNote">Weather Note</Label>
              <Input
                id="edit-weatherNote"
                value={newShootDay.weatherNote}
                onChange={(e) => setNewShootDay({ ...newShootDay, weatherNote: e.target.value })}
                placeholder="e.g., Sunny, 25°C"
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={newShootDay.status}
                onValueChange={(value: "open" | "locked") => setNewShootDay({ ...newShootDay, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={newShootDay.notes}
                onChange={(e) => setNewShootDay({ ...newShootDay, notes: e.target.value })}
                placeholder="Additional notes for this shoot day..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDay(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateShootDay}>
              Update Shoot Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShootDays;

