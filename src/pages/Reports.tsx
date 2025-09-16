import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileText, 
  BarChart3, 
  Users,
  Package,
  Receipt,
  Clock
} from "lucide-react";
import { storage } from "@/lib/storage";
import { analytics } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import type { 
  Project, 
  ShootDayExtended, 
  ProductionDaySummary,
  ScheduleAdherenceReport,
  PropsCustodyReport,
  CrewPerformanceReport
} from "@/lib/types";

const Reports = () => {
  const { toast } = useToast();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [shootDays, setShootDays] = useState<ShootDayExtended[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadProjectData();
  }, []);

  const loadProjectData = () => {
    const projectId = storage.getCurrentProject();
    if (projectId) {
      const project = storage.getProject(projectId);
      setCurrentProject(project);
      
      if (project) {
        const days = storage.getShootDaysExtended(projectId);
        setShootDays(days);
      }
    }
  };

  const getDateRangePresets = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return [
      { value: "today", label: "Today", date: today.toISOString().split('T')[0] },
      { value: "yesterday", label: "Yesterday", date: yesterday.toISOString().split('T')[0] },
      { value: "week", label: "Last 7 Days", date: weekAgo.toISOString().split('T')[0] },
      { value: "month", label: "Last 30 Days", date: monthAgo.toISOString().split('T')[0] },
      { value: "all", label: "All Time", date: "" },
    ];
  };

  const getFilteredShootDays = () => {
    if (!currentProject) return [];
    
    let filtered = shootDays;
    
    if (selectedDateRange !== "all") {
      const presets = getDateRangePresets();
      const preset = presets.find(p => p.value === selectedDateRange);
      if (preset && preset.date) {
        filtered = filtered.filter(day => day.date >= preset.date);
      }
    }
    
    return filtered;
  };

  const getProductionDaySummaries = () => {
    const filteredDays = getFilteredShootDays();
    return filteredDays.map(day => storage.getProductionDaySummary(day.id)).filter(Boolean) as ProductionDaySummary[];
  };

  const getScheduleAdherenceReports = () => {
    const filteredDays = getFilteredShootDays();
    return filteredDays.map(day => storage.getScheduleAdherenceReport(day.id)).filter(Boolean) as ScheduleAdherenceReport[];
  };

  const getPropsCustodyReports = () => {
    const filteredDays = getFilteredShootDays();
    return filteredDays.map(day => storage.getPropsCustodyReport(day.id)).filter(Boolean) as PropsCustodyReport[];
  };

  const getCrewPerformanceReports = () => {
    const filteredDays = getFilteredShootDays();
    return filteredDays.map(day => storage.getCrewPerformanceReport(day.id)).filter(Boolean) as CrewPerformanceReport[];
  };

  const handleExportAll = () => {
    toast({
      title: "Export Started",
      description: "All reports are being generated...",
    });
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project data...</p>
        </div>
      </div>
    );
  }

  const productionDaySummaries = getProductionDaySummaries();
  const scheduleReports = getScheduleAdherenceReports();
  const propsReports = getPropsCustodyReports();
  const crewReports = getCrewPerformanceReports();

  const totalBudget = productionDaySummaries.reduce((sum, day) => sum + day.totalBudget, 0);
  const totalSpent = productionDaySummaries.reduce((sum, day) => sum + day.totalSpent, 0);
  const totalVariance = totalSpent - totalBudget;
  const totalVariancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

  const totalShots = scheduleReports.reduce((sum, report) => sum + report.totalShots, 0);
  const completedShots = scheduleReports.reduce((sum, report) => sum + report.completedShots, 0);
  const averageCompletion = totalShots > 0 ? (completedShots / totalShots) * 100 : 0;

  const totalProps = propsReports.reduce((sum, report) => sum + report.openCheckouts.length + report.returnedToday.length, 0);
  const overdueProps = propsReports.reduce((sum, report) => sum + report.overdueReturns.length, 0);

  const totalFeedback = crewReports.reduce((sum, report) => sum + report.totalResponses, 0);
  const averageRating = crewReports.length > 0 
    ? crewReports.reduce((sum, report) => sum + report.averageRating, 0) / crewReports.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Production Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive reporting for {currentProject.title}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getDateRangePresets().map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget vs Actual</p>
                <p className="text-2xl font-bold">
                  ₹{totalSpent.toLocaleString()} / ₹{totalBudget.toLocaleString()}
                </p>
                <p className={`text-sm ${totalVariance >= 0 ? 'text-destructive' : 'text-success'}`}>
                  {totalVariance >= 0 ? '+' : ''}₹{totalVariance.toLocaleString()} 
                  ({totalVariancePercent >= 0 ? '+' : ''}{totalVariancePercent.toFixed(1)}%)
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
                <p className="text-sm text-muted-foreground">Schedule Completion</p>
                <p className="text-2xl font-bold">
                  {completedShots}/{totalShots}
                </p>
                <p className="text-sm text-muted-foreground">
                  {averageCompletion.toFixed(1)}% complete
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Crew Feedback</p>
                <p className="text-2xl font-bold">
                  {averageRating.toFixed(1)}/5
                </p>
                <p className="text-sm text-muted-foreground">
                  {totalFeedback} responses
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
                  {totalProps} total
                </p>
                <p className="text-sm text-muted-foreground">
                  {overdueProps} overdue
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
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="crew" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Crew
          </TabsTrigger>
          <TabsTrigger value="props" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Props
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Production Days Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productionDaySummaries.map((summary) => (
                    <div key={summary.shootDayId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(summary.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">{summary.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{summary.totalSpent.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {summary.scheduleProgress.percentage.toFixed(1)}% complete
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate DCR for Today
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Adherence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduleReports.map((report) => (
                  <div key={report.shootDayId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{new Date(report.date).toLocaleDateString()}</h4>
                      <Badge variant="outline">
                        {report.completionPercentage.toFixed(1)}% complete
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Shots</p>
                        <p className="font-medium">{report.totalShots}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-medium text-success">{report.completedShots}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Dropped</p>
                        <p className="font-medium text-destructive">{report.droppedShots}</p>
                      </div>
                    </div>
                    {report.topDelays.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-2">Top Delays:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.topDelays.slice(0, 3).map((delay, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {delay.reason} ({delay.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crew" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crew Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crewReports.map((report) => (
                  <div key={report.shootDayId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{new Date(report.date).toLocaleDateString()}</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className={i < Math.round(report.averageRating) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {report.averageRating.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Responses</p>
                        <p className="font-medium">{report.totalResponses}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Anonymous</p>
                        <p className="font-medium">{report.anonymousResponses}</p>
                      </div>
                    </div>
                    {report.topIssues.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-2">Top Issues:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.topIssues.slice(0, 5).map((issue, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {issue.tag} ({issue.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="props" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Props Chain of Custody</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propsReports.map((report) => (
                  <div key={report.shootDayId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{new Date(report.date).toLocaleDateString()}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {report.openCheckouts.length} out
                        </Badge>
                        <Badge variant="outline">
                          {report.overdueReturns.length} overdue
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {report.overdueReturns.length > 0 && (
                        <div>
                          <p className="text-sm text-destructive font-medium mb-1">Overdue Returns:</p>
                          {report.overdueReturns.slice(0, 3).map((item, index) => (
                            <p key={index} className="text-xs text-muted-foreground">
                              {item.propName} - {item.daysOverdue} days overdue
                            </p>
                          ))}
                        </div>
                      )}
                      {report.returnedToday.length > 0 && (
                        <div>
                          <p className="text-sm text-success font-medium mb-1">Returned Today:</p>
                          {report.returnedToday.slice(0, 3).map((item, index) => (
                            <p key={index} className="text-xs text-muted-foreground">
                              {item.propName} - {item.returnCondition}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;

