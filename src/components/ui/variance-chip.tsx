import { cn } from "@/lib/utils";

interface VarianceChipProps {
  variance: number;
  percentage?: number;
  currency?: string;
  className?: string;
}

export const VarianceChip = ({ 
  variance, 
  percentage, 
  currency = "₹", 
  className 
}: VarianceChipProps) => {
  const isPositive = variance >= 0;
  const isNeutral = variance === 0;

  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border transition-quick",
        {
          "variance-positive": isPositive && !isNeutral,
          "variance-negative": !isPositive,
          "bg-muted text-muted-foreground border-border": isNeutral,
        },
        className
      )}
    >
      {isNeutral ? (
        "On Budget"
      ) : (
        <>
          {isPositive ? "+" : ""}
          {currency}{Math.abs(variance).toLocaleString()}
          {percentage !== undefined && (
            <span className="ml-1">
              ({isPositive ? "+" : ""}{percentage.toFixed(1)}%)
            </span>
          )}
        </>
      )}
    </div>
  );
};