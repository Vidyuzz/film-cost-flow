import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  CreditCard, 
  FileText, 
  Settings, 
  PlusCircle,
  Camera,
  Calendar,
  Wallet,
  Users,
  Package
} from "lucide-react";
import { storage } from "@/lib/storage";
import type { Project } from "@/lib/types";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  useEffect(() => {
    // Initialize storage and get current project
    storage.initialize();
    const currentProjectId = storage.getCurrentProject();
    if (currentProjectId) {
      const project = storage.getProject(currentProjectId);
      setCurrentProject(project);
    }
  }, []);

  const navigation = [
    { 
      name: "Dashboard", 
      href: "/", 
      icon: BarChart3,
      description: "DCR & Overview" 
    },
    { 
      name: "Expenses", 
      href: "/expenses", 
      icon: CreditCard,
      description: "All Expenses" 
    },
    { 
      name: "Petty Cash", 
      href: "/petty-cash", 
      icon: Wallet,
      description: "Cash Management" 
    },
    { 
      name: "Vendors", 
      href: "/vendors", 
      icon: Settings,
      description: "Vendor Management" 
    },
    { 
      name: "Reports", 
      href: "/reports", 
      icon: FileText,
      description: "Export & Analytics" 
    },
    { 
      name: "Crew", 
      href: "/crew", 
      icon: Users,
      description: "Team Management" 
    },
    { 
      name: "Props", 
      href: "/props", 
      icon: Package,
      description: "Equipment & Assets" 
    },
  ];

  const quickActions = [
    {
      name: "Add Expense",
      href: "/project/add-expense",
      icon: PlusCircle,
      variant: "default" as const,
    },
    {
      name: "New Project",
      href: "/project/new",
      icon: Settings,
      variant: "outline" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Camera className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent">
                  Film Expense Tracker
                </h1>
              </div>
              
              {currentProject && (
                <div className="hidden md:flex items-center space-x-2">
                  <Badge variant="secondary" className="text-sm">
                    {currentProject.title}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {currentProject.currency}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {quickActions.map((action) => (
                <Button 
                  key={action.name}
                  variant={action.variant}
                  size="sm"
                  asChild
                  className="transition-smooth"
                >
                  <Link to={action.href} className="flex items-center space-x-1">
                    <action.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{action.name}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Sidebar Navigation */}
          <nav className="lg:col-span-3">
            <Card className="p-4 gradient-card shadow-medium">
              <div className="space-y-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-smooth ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-soft"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs opacity-70">{item.description}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {currentProject && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Quick Links
                  </h3>
                  <div className="space-y-2 text-sm">
                    <Link
                      to="/project/budget"
                      className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-quick"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Budget Editor</span>
                    </Link>
                    <Link
                      to="/project/shoot-days"
                      className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-quick"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Shoot Days</span>
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          </nav>

          {/* Main Content Area */}
          <main className="lg:col-span-9">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};