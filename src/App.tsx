import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import PettyCash from "./pages/PettyCash";
import Reports from "./pages/Reports";
import ProjectNew from "./pages/ProjectNew";
import ProjectBudget from "./pages/ProjectBudget";
import AddExpense from "./pages/AddExpense";
import Vendors from "./pages/Vendors";
import ProductionDayHub from "./pages/ProductionDayHub";
import ShootDays from "./pages/ShootDays";
import Crew from "./pages/Crew";
import Props from "./pages/Props";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Projects from "./pages/Projects";
import ProjectsNew from "./pages/ProjectsNew";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectEdit from "./pages/ProjectEdit";
import { storage } from "./lib/storage";

const queryClient = new QueryClient();

const App = () => {
  // Initialize storage on app start
  storage.initialize();

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
            <Routes>
              {/* Auth & Profile Routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Projects Routes */}
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/new" element={<ProjectsNew />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/projects/:id/edit" element={<ProjectEdit />} />
              
              {/* Legacy Routes */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/petty-cash" element={<PettyCash />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/project/new" element={<ProjectNew />} />
              <Route path="/project/budget" element={<ProjectBudget />} />
              <Route path="/project/shoot-days" element={<ShootDays />} />
              <Route path="/crew" element={<Crew />} />
              <Route path="/props" element={<Props />} />
              <Route path="/project/add-expense" element={<AddExpense />} />
              <Route path="/day/:id" element={<ProductionDayHub />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
