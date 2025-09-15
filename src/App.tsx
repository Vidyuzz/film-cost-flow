import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import PettyCash from "./pages/PettyCash";
import Reports from "./pages/Reports";
import ProjectNew from "./pages/ProjectNew";
import ProjectBudget from "./pages/ProjectBudget";
import AddExpense from "./pages/AddExpense";
import Vendors from "./pages/Vendors";
import NotFound from "./pages/NotFound";
import { storage } from "./lib/storage";

const queryClient = new QueryClient();

const App = () => {
  // Initialize storage on app start
  storage.initialize();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/petty-cash" element={<PettyCash />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/project/new" element={<ProjectNew />} />
              <Route path="/project/budget" element={<ProjectBudget />} />
              <Route path="/project/add-expense" element={<AddExpense />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
