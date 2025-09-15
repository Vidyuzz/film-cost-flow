import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PettyCashFloatForm } from "@/components/forms/PettyCashFloatForm";
import { PettyCashTxnForm } from "@/components/forms/PettyCashTxnForm";
import { 
  Plus, 
  Wallet, 
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Receipt
} from "lucide-react";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import type { Project, PettyCashFloat, PettyCashTxn } from "@/lib/types";

const PettyCash = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [floats, setFloats] = useState<PettyCashFloat[]>([]);
  const [transactions, setTransactions] = useState<PettyCashTxn[]>([]);
  const [showFloatForm, setShowFloatForm] = useState(false);
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [selectedFloat, setSelectedFloat] = useState<PettyCashFloat | undefined>();

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    storage.initialize();
    const currentProjectId = storage.getCurrentProject();
    
    if (currentProjectId) {
      const project = storage.getProject(currentProjectId);
      setCurrentProject(project);
      
      const projectFloats = storage.getPettyCashFloats(currentProjectId);
      setFloats(projectFloats);
      
      const allTransactions: PettyCashTxn[] = [];
      projectFloats.forEach(float => {
        const floatTxns = storage.getPettyCashTxns(float.id);
        allTransactions.push(...floatTxns);
      });
      setTransactions(allTransactions);
    }
  };

  const handleFloatSuccess = () => {
    loadData();
  };

  const handleTxnSuccess = () => {
    loadData();
    setSelectedFloat(undefined);
  };

  const handleRecordTransaction = (float: PettyCashFloat) => {
    setSelectedFloat(float);
    setShowTxnForm(true);
  };

  const getFloatTransactions = (floatId: string) => {
    return transactions.filter(txn => txn.floatId === floatId);
  };

  const totalIssuedAmount = floats.reduce((sum, float) => sum + float.issuedAmount, 0);
  const totalBalance = floats.reduce((sum, float) => sum + float.balance, 0);
  const totalSpent = totalIssuedAmount - totalBalance;

  if (!currentProject) {
    return (
      <EmptyState
        icon={Wallet}
        title="No project selected"
        description="Please create or select a project to manage petty cash."
        onAction={() => window.location.href = "/project/new"}
        actionLabel="Create Project"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold gradient-hero bg-clip-text text-transparent">
            Petty Cash Management
          </h1>
          <p className="text-muted-foreground">
            Track petty cash floats and transactions for {currentProject.title}
          </p>
        </div>
        <Button onClick={() => setShowFloatForm(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Issue Float
        </Button>
      </div>

      {/* Summary Cards */}
      {floats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issued</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentProject.currency} {totalIssuedAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentProject.currency} {totalBalance.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentProject.currency} {totalSpent.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floats List */}
      {floats.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No petty cash floats yet"
          description="Start by issuing a petty cash float to a team member."
          onAction={() => setShowFloatForm(true)}
          actionLabel="Issue First Float"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {floats.map((float) => {
            const floatTxns = getFloatTransactions(float.id);
            const recentTxns = floatTxns
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 3);

            return (
              <Card key={float.id} className="hover:shadow-medium transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-primary" />
                        <span>{float.ownerUserId}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">
                          Issued: {currentProject.currency} {float.issuedAmount.toLocaleString()}
                        </Badge>
                        <Badge 
                          variant={float.balance > 0 ? "default" : "secondary"}
                          className={float.balance === 0 ? "bg-orange-500 text-white" : ""}
                        >
                          Balance: {currentProject.currency} {float.balance.toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRecordTransaction(float)}
                    >
                      <Receipt className="h-4 w-4 mr-1" />
                      Record
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Issued: {new Date(float.issuedAt).toLocaleDateString()}</span>
                  </div>
                  
                  {recentTxns.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recent Transactions</h4>
                      <div className="space-y-1">
                        {recentTxns.map((txn) => (
                          <div key={txn.id} className="flex items-center justify-between text-sm">
                            <span className="truncate flex-1">{txn.description}</span>
                            <div className="flex items-center space-x-2">
                              <span className={txn.type === "debit" ? "text-destructive" : "text-green-600"}>
                                {txn.type === "debit" ? "-" : "+"}
                                {currentProject.currency} {txn.amount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {floatTxns.length > 3 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          +{floatTxns.length - 3} more transactions
                        </p>
                      )}
                    </div>
                  )}
                  
                  {floatTxns.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      No transactions yet
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Forms */}
      <PettyCashFloatForm
        open={showFloatForm}
        onOpenChange={setShowFloatForm}
        projectId={currentProject.id}
        onSuccess={handleFloatSuccess}
      />

      {selectedFloat && (
        <PettyCashTxnForm
          open={showTxnForm}
          onOpenChange={(open) => {
            setShowTxnForm(open);
            if (!open) setSelectedFloat(undefined);
          }}
          float={selectedFloat}
          onSuccess={handleTxnSuccess}
        />
      )}
    </div>
  );
};

export default PettyCash;