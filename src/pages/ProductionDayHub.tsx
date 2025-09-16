import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Cloud, 
  Lock, 
  Unlock,
  Download,
  FileText,
  Users,
  Package,
  Receipt,
  MessageSquare,
  Settings
} from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import type { 
  ShootDayExtended, 
  ProductionDaySummary,
  ScheduleItem,
  CrewFeedback,
  PropCheckout,
  Expense
} from "@/lib/types";

// Import tab components (we'll create these next)
import ScheduleTab from "@/components/production-day/ScheduleTab";
import ExpensesTab from "@/components/production-day/ExpensesTab";
import FeedbackTab from "@/components/production-day/FeedbackTab";
import PropsTab from "@/components/production-day/PropsTab";

const ProductionDayHub = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [shootDay, setShootDay] = useState<ShootDayExtended | null>(null);
  const [summary, setSummary] = useState<ProductionDaySummary | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [activeTab, setActiveTab] = useState("schedule");

  useEffect(() => {
    if (id) {
      loadShootDayData();
    }
  }, [id]);

  const loadShootDayData = () => {
    if (!id) return;
    
    const day = storage.getShootDayExtended(id);
    if (!day) {
      toast({
        title: "Error",
        description: "Production day not found.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    setShootDay(day);
    setIsLocked(day.status === 'locked');
    
    const daySummary = storage.getProductionDaySummary(id);
    setSummary(daySummary);
  };

  const toggleLock = () => {
    if (!shootDay || !id) return;
    
    const newStatus = isLocked ? 'open' : 'locked';
    const updated = storage.updateShootDayExtended(id, { status: newStatus });
    
    if (updated) {
      setShootDay(updated);
      setIsLocked(newStatus === 'locked');
      toast({
        title: newStatus === 'locked' ? "Day Locked" : "Day Unlocked",
        description: newStatus === 'locked' 
          ? "This production day is now locked and cannot be edited."
          : "This production day is now open for editing.",
      });
    }
  };

  const handleExportDCR = () => {
    if (!shootDay || !summary) return;
    
    // TODO: Implement DCR export
    toast({
      title: "Export Started",
      description: "Daily Cost Report is being generated...",
    });
  };

  const handleExportCSV = () => {
    if (!shootDay) return;
    
    // TODO: Implement CSV export
    toast({
      title: "Export Started", 
      description: "CSV export is being generated...",
    });
  };

  if (!shootDay || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading production day...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    return status === 'locked' 
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-success/10 text-success border-success/20";
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-destructive";
    if (variance < 0) return "text-success";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Production Day</h1>
            <Badge 
              variant="outline" 
              className={getStatusColor(shootDay.status)}
            >
              {isLocked ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
              {shootDay.status === 'locked' ? 'Locked' : 'Open'}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(shootDay.date).toLocaleDateString()}
            </div>
            {shootDay.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {shootDay.location}
              </div>
            )}
            {shootDay.callTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {shootDay.callTime} - {shootDay.wrapTime || 'TBD'}
              </div>
            )}
            {shootDay.weatherNote && (
              <div className="flex items-center gap-1">
                <Cloud className="h-4 w-4" />
                {shootDay.weatherNote}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLock}
            disabled={false} // Allow toggling for now
          >
            {isLocked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
            {isLocked ? 'Unlock' : 'Lock'} Day
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportDCR}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export DCR
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget vs Actual</p>
                <p className="text-2xl font-bold">
                  ₹{summary.totalSpent.toLocaleString()} / ₹{summary.totalBudget.toLocaleString()}
                </p>
                <p className={`text-sm ${getVarianceColor(summary.variance)}`}>
                  {summary.variance >= 0 ? '+' : ''}₹{summary.variance.toLocaleString()} 
                  ({summary.variancePercent >= 0 ? '+' : ''}{summary.variancePercent.toFixed(1)}%)
                </p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Schedule Progress</p>
                <p className="text-2xl font-bold">
                  {summary.scheduleProgress.completed}/{summary.scheduleProgress.total}
                </p>
                <div className="mt-2">
                  <Progress value={summary.scheduleProgress.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.scheduleProgress.percentage.toFixed(1)}% complete
                  </p>
                </div>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Crew Feedback</p>
                <p className="text-2xl font-bold">
                  {summary.crewFeedback.averageRating.toFixed(1)}/5
                </p>
                <p className="text-sm text-muted-foreground">
                  {summary.crewFeedback.totalResponses} responses
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Props Status</p>
                <p className="text-2xl font-bold">
                  {summary.propsStatus.checkedOut}/{summary.propsStatus.total}
                </p>
                <p className="text-sm text-muted-foreground">
                  {summary.propsStatus.overdue} overdue
                </p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="props" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Props
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <ScheduleTab 
            shootDayId={shootDay.id}
            isLocked={isLocked}
            onDataChange={loadShootDayData}
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ExpensesTab 
            shootDayId={shootDay.id}
            projectId={shootDay.projectId}
            isLocked={isLocked}
            onDataChange={loadShootDayData}
          />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <FeedbackTab 
            shootDayId={shootDay.id}
            projectId={shootDay.projectId}
            isLocked={isLocked}
            onDataChange={loadShootDayData}
          />
        </TabsContent>

        <TabsContent value="props" className="space-y-4">
          <PropsTab 
            shootDayId={shootDay.id}
            projectId={shootDay.projectId}
            isLocked={isLocked}
            onDataChange={loadShootDayData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionDayHub;

