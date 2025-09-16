import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  MessageSquare, 
  Star, 
  Users, 
  Eye, 
  EyeOff,
  Save,
  Edit,
  Trash2,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import type { CrewFeedback, Crew } from "@/lib/types";

interface FeedbackTabProps {
  shootDayId: string;
  projectId: string;
  isLocked: boolean;
  onDataChange: () => void;
}

const FEEDBACK_TAGS = [
  "coordination", "delays", "comms", "setup", "sound", 
  "lighting", "props", "makeup", "catering", "transport",
  "equipment", "location", "weather", "safety", "other"
];

const FeedbackTab = ({ shootDayId, projectId, isLocked, onDataChange }: FeedbackTabProps) => {
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<CrewFeedback[]>([]);
  const [crew, setCrew] = useState<Crew[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<CrewFeedback | null>(null);
  const [formData, setFormData] = useState({
    crewId: "",
    isAnonymous: false,
    rating: 3,
    tags: [] as string[],
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [shootDayId, projectId]);

  const loadData = () => {
    const dayFeedback = storage.getCrewFeedback(shootDayId);
    setFeedback(dayFeedback);
    
    const projectCrew = storage.getCrew(projectId);
    setCrew(projectCrew);
  };

  const resetForm = () => {
    setFormData({
      crewId: "",
      isAnonymous: false,
      rating: 3,
      tags: [],
      notes: "",
    });
    setEditingFeedback(null);
  };

  const handleOpenDialog = (feedbackItem?: CrewFeedback) => {
    if (feedbackItem) {
      setEditingFeedback(feedbackItem);
      setFormData({
        crewId: feedbackItem.crewId || "",
        isAnonymous: feedbackItem.isAnonymous,
        rating: feedbackItem.rating,
        tags: feedbackItem.tags,
        notes: feedbackItem.notes || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.crewId && !formData.isAnonymous) {
      toast({
        title: "Validation Error",
        description: "Please select a crew member or mark as anonymous.",
        variant: "destructive",
      });
      return;
    }

    try {
      const feedbackData = {
        shootDayId,
        crewId: formData.isAnonymous ? undefined : formData.crewId,
        isAnonymous: formData.isAnonymous,
        rating: formData.rating,
        tags: formData.tags,
        notes: formData.notes,
      };

      if (editingFeedback) {
        storage.updateCrewFeedback(editingFeedback.id, feedbackData);
        toast({
          title: "Feedback Updated",
          description: "The feedback has been updated successfully.",
        });
      } else {
        storage.addCrewFeedback(feedbackData);
        toast({
          title: "Feedback Added",
          description: "The feedback has been added successfully.",
        });
      }
      
      loadData();
      onDataChange();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    if (isLocked) return;
    
    // Note: We don't have a delete method in storage, so we'll skip this for now
    toast({
      title: "Feature Not Available",
      description: "Feedback deletion is not available in this version.",
      variant: "destructive",
    });
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-success";
    if (rating >= 3) return "text-warning";
    return "text-destructive";
  };

  const getCrewMemberName = (crewId?: string) => {
    if (!crewId) return "Anonymous";
    const member = crew.find(c => c.id === crewId);
    return member ? member.name : "Unknown";
  };

  const getCrewMemberRole = (crewId?: string) => {
    if (!crewId) return "";
    const member = crew.find(c => c.id === crewId);
    return member ? member.role : "";
  };

  const averageRating = feedback.length > 0 
    ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
    : 0;

  const topIssues = feedback.reduce((acc, f) => {
    f.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const sortedTopIssues = Object.entries(topIssues)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Crew Feedback</h3>
          <p className="text-sm text-muted-foreground">
            {feedback.length} responses • {averageRating.toFixed(1)}/5 average rating
          </p>
        </div>
        {!isLocked && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Feedback
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingFeedback ? 'Edit Feedback' : 'Add Feedback'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAnonymous"
                    checked={formData.isAnonymous}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, isAnonymous: !!checked, crewId: "" })
                    }
                  />
                  <Label htmlFor="isAnonymous">Anonymous feedback</Label>
                </div>

                {!formData.isAnonymous && (
                  <div>
                    <Label htmlFor="crew">Crew Member *</Label>
                    <Select
                      value={formData.crewId}
                      onValueChange={(value) => setFormData({ ...formData, crewId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select crew member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {crew.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} ({member.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Rating: {formData.rating}/5</Label>
                  <div className="mt-2">
                    <Slider
                      value={[formData.rating]}
                      onValueChange={(value) => setFormData({ ...formData, rating: value[0] })}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                    <div className="flex justify-center mt-2">
                      {getRatingStars(formData.rating)}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Issues & Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {FEEDBACK_TAGS.map(tag => (
                      <Badge
                        key={tag}
                        variant={formData.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional feedback or comments..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingFeedback ? 'Update' : 'Add'} Feedback
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className={`text-2xl font-bold ${getRatingColor(averageRating)}`}>
                  {averageRating.toFixed(1)}/5
                </p>
                <div className="flex mt-1">
                  {getRatingStars(Math.round(averageRating))}
                </div>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-2xl font-bold">{feedback.length}</p>
                <p className="text-xs text-muted-foreground">
                  {feedback.filter(f => f.isAnonymous).length} anonymous
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Issues</p>
                <p className="text-2xl font-bold">{sortedTopIssues.length}</p>
                <p className="text-xs text-muted-foreground">
                  {sortedTopIssues[0]?.[0] || 'None'} most common
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Issues */}
      {sortedTopIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedTopIssues.map(([tag, count]) => (
                <div key={tag} className="flex items-center justify-between">
                  <Badge variant="outline">{tag}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {count} mention{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback List */}
      <div className="space-y-3">
        {feedback.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Feedback</h3>
              <p className="text-muted-foreground mb-4">
                Start by collecting feedback from crew members.
              </p>
              {!isLocked && (
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Feedback
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          feedback.map((feedbackItem) => (
            <Card key={feedbackItem.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {feedbackItem.isAnonymous ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">
                          {getCrewMemberName(feedbackItem.crewId)}
                        </span>
                        {!feedbackItem.isAnonymous && (
                          <span className="text-sm text-muted-foreground">
                            ({getCrewMemberRole(feedbackItem.crewId)})
                          </span>
                        )}
                      </div>
                      <div className="flex">
                        {getRatingStars(feedbackItem.rating)}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getRatingColor(feedbackItem.rating)}
                      >
                        {feedbackItem.rating}/5
                      </Badge>
                    </div>
                    
                    {feedbackItem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {feedbackItem.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {feedbackItem.notes && (
                      <p className="text-sm text-muted-foreground">
                        {feedbackItem.notes}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(feedbackItem.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {!isLocked && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(feedbackItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(feedbackItem.id)}
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

export default FeedbackTab;

