import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, description, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-2xl p-6 border border-border/50 shadow-lg shadow-black/20 hover:border-border transition-all duration-300 group",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-display font-bold text-foreground mt-2">{value}</h3>
          
          {(description || trend) && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              {trend && (
                <span className={cn(
                  "font-medium px-2 py-0.5 rounded-md",
                  trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}>
                  {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
                </span>
              )}
              {description && <span className="text-muted-foreground">{description}</span>}
            </div>
          )}
        </div>
        <div className="p-3 bg-white/5 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
