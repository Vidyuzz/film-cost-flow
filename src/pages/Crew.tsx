import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  PlusCircle, 
  Users, 
  User, 
  Phone, 
  Mail, 
  Edit, 
  Trash2,
  Crown,
  Camera,
  Mic,
  Lightbulb,
  Wrench
} from "lucide-react";
import { storage } from "@/lib/storage";
import { toast } from "@/components/ui/use-toast";
import type { Project, Crew } from "@/lib/types";

const Crew = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [crewMembers, setCrewMembers] = useState<Crew[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<Crew | null>(null);
  const [newCrewMember, setNewCrewMember] = useState({
    name: "",
    role: "",
    contact: ""
  });

  const roleIcons: { [key: string]: any } = {
    "Director": Crown,
    "Producer": User,
    "Cinematographer": Camera,
    "Sound Engineer": Mic,
    "Gaffer": Lightbulb,
    "Grip": Wrench,
    "Production Assistant": User,
    "Script Supervisor": User,
    "Makeup Artist": User,
    "Costume Designer": User,
    "Other": User
  };

  useEffect(() => {
    const projectId = storage.getCurrentProject();
    if (projectId) {
      const project = storage.getProject(projectId);
      setCurrentProject(project);
      const crew = storage.getCrew(projectId);
      setCrewMembers(crew);
    }
  }, []);

  const handleCreateCrewMember = () => {
    if (!currentProject || !newCrewMember.name || !newCrewMember.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in name and role.",
        variant: "destructive",
      });
      return;
    }

    try {
      const crewMember = storage.addCrew({
        projectId: currentProject.id,
        name: newCrewMember.name,
        role: newCrewMember.role,
        contact: newCrewMember.contact || undefined,
      });

      setCrewMembers(prev => [...prev, crewMember]);
      setNewCrewMember({ name: "", role: "", contact: "" });
      setShowCreateDialog(false);

      toast({
        title: "Crew member added",
        description: `Successfully added ${newCrewMember.name} to the crew`,
      });
    } catch (error) {
      console.error("Error creating crew member:", error);
      toast({
        title: "Error",
        description: "Failed to add crew member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCrewMember = () => {
    if (!editingMember) return;

    try {
      const updatedMember = storage.updateCrew(editingMember.id, {
        name: newCrewMember.name,
        role: newCrewMember.role,
        contact: newCrewMember.contact || undefined,
      });

      if (updatedMember) {
        setCrewMembers(prev => prev.map(member => member.id === editingMember.id ? updatedMember : member));
        setEditingMember(null);
        setNewCrewMember({ name: "", role: "", contact: "" });

        toast({
          title: "Crew member updated",
          description: `Successfully updated ${updatedMember.name}`,
        });
      }
    } catch (error) {
      console.error("Error updating crew member:", error);
      toast({
        title: "Error",
        description: "Failed to update crew member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCrewMember = (id: string) => {
    if (window.confirm("Are you sure you want to remove this crew member? This action cannot be undone.")) {
      try {
        storage.deleteCrew(id);
        setCrewMembers(prev => prev.filter(member => member.id !== id));
        toast({
          title: "Crew member removed",
          description: "Crew member has been removed from the project.",
        });
      } catch (error) {
        console.error("Error deleting crew member:", error);
        toast({
          title: "Error",
          description: "Failed to remove crew member. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditCrewMember = (member: Crew) => {
    setEditingMember(member);
    setNewCrewMember({
      name: member.name,
      role: member.role,
      contact: member.contact || ""
    });
  };

  const getRoleIcon = (role: string) => {
    const IconComponent = roleIcons[role] || User;
    return <IconComponent className="h-4 w-4" />;
  };

  if (!currentProject) {
    return <div className="text-center py-8">Please select a project to manage crew.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Crew Management</h2>
          <p className="text-muted-foreground">
            Manage crew members for {currentProject.title}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <PlusCircle className="h-4 w-4" />
              <span>Add Crew Member</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Crew Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newCrewMember.name}
                  onChange={(e) => setNewCrewMember({ ...newCrewMember, name: e.target.value })}
                  placeholder="e.g., John Smith"
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  value={newCrewMember.role}
                  onChange={(e) => setNewCrewMember({ ...newCrewMember, role: e.target.value })}
                  placeholder="e.g., Director, Cinematographer, Sound Engineer"
                />
              </div>
              <div>
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={newCrewMember.contact}
                  onChange={(e) => setNewCrewMember({ ...newCrewMember, contact: e.target.value })}
                  placeholder="e.g., john@example.com, +1234567890"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCrewMember}>
                Add Crew Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {crewMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Crew Members"
          description="Add crew members to start building your production team."
          action={
            <Button onClick={() => setShowCreateDialog(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Crew Member
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {crewMembers.map((member) => (
            <Card key={member.id} className="shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {getRoleIcon(member.role)}
                    <span>{member.name}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCrewMember(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCrewMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      {getRoleIcon(member.role)}
                      <span>{member.role}</span>
                    </Badge>
                  </div>
                  {member.contact && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      {member.contact.includes('@') ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}
                      <span>{member.contact}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Crew Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={newCrewMember.name}
                onChange={(e) => setNewCrewMember({ ...newCrewMember, name: e.target.value })}
                placeholder="e.g., John Smith"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role *</Label>
              <Input
                id="edit-role"
                value={newCrewMember.role}
                onChange={(e) => setNewCrewMember({ ...newCrewMember, role: e.target.value })}
                placeholder="e.g., Director, Cinematographer, Sound Engineer"
              />
            </div>
            <div>
              <Label htmlFor="edit-contact">Contact</Label>
              <Input
                id="edit-contact"
                value={newCrewMember.contact}
                onChange={(e) => setNewCrewMember({ ...newCrewMember, contact: e.target.value })}
                placeholder="e.g., john@example.com, +1234567890"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCrewMember}>
              Update Crew Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Crew;

