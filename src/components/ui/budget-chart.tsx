interface BudgetChartProps {
  data: Array<{
    department: string;
    budget: number;
    actual: number;
    variance: number;
  }>;
  currency: string;
}

export const BudgetChart = ({ data, currency }: BudgetChartProps) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No budget data available
      </div>
    );
  }

  const maxValue = Math.max(...data.flatMap(d => [d.budget, d.actual]));
  const barHeight = 40;
  const barSpacing = 16;
  const chartHeight = data.length * (barHeight + barSpacing) + 40;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-primary rounded"></div>
          <span>Budget</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-secondary rounded"></div>
          <span>Actual</span>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => {
          const budgetWidth = (item.budget / maxValue) * 100;
          const actualWidth = (item.actual / maxValue) * 100;
          const isOverBudget = item.actual > item.budget;

          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  {item.department}
                </span>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{currency} {item.budget.toLocaleString()} budgeted</div>
                  <div className={isOverBudget ? "text-destructive" : "text-success"}>
                    {currency} {item.actual.toLocaleString()} actual
                  </div>
                </div>
              </div>
              
              <div className="relative">
                {/* Budget bar */}
                <div className="w-full h-6 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${budgetWidth}%` }}
                  />
                </div>
                
                {/* Actual bar */}
                <div className="absolute top-1 left-0 w-full h-4 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ease-out ${
                      isOverBudget ? 'bg-destructive' : 'bg-secondary'
                    }`}
                    style={{ width: `${actualWidth}%` }}
                  />
                </div>
              </div>
              
              {/* Variance indicator */}
              {item.variance !== 0 && (
                <div className="flex justify-end">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isOverBudget 
                      ? 'bg-destructive/10 text-destructive' 
                      : 'bg-success/10 text-success'
                  }`}>
                    {isOverBudget ? '+' : ''}{currency} {Math.abs(item.variance).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};