import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useGetOwnerDashboard } from "@workspace/api-client-react";
import { Building2, Home, Percent, Wallet, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function OwnerDashboard() {
  const { data: dashboard, isLoading } = useGetOwnerDashboard();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-8">
          <div className="h-12 w-64 bg-white/5 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
          </div>
          <div className="h-[400px] bg-white/5 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!dashboard) return null;

  return (
    <AppLayout>
      <PageHeader 
        title="Portfolio Overview" 
        description="Monitor your properties, income, and key performance indicators."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Properties" 
          value={dashboard.totalProperties} 
          icon={Building2} 
          description="Active in portfolio"
        />
        <StatCard 
          title="Total Units" 
          value={dashboard.totalUnits} 
          icon={Home} 
          description={`${dashboard.occupiedUnits} occupied, ${dashboard.vacantUnits} vacant`}
        />
        <StatCard 
          title="Occupancy Rate" 
          value={`${dashboard.occupancyRate.toFixed(1)}%`} 
          icon={Percent} 
          trend={{ value: 2.4, isPositive: true }}
          description="vs. last month"
        />
        <StatCard 
          title="Monthly Income" 
          value={formatCurrency(dashboard.monthlyIncome)} 
          icon={Wallet} 
          trend={{ value: 5.2, isPositive: true }}
          className="border-primary/30 shadow-primary/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-display font-bold text-foreground">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground">Yearly income overview</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">YTD Total</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(dashboard.yearlyIncome)}</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.incomeChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `R${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions & Alerts */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-foreground">Action Required</h3>
              <span className="bg-warning/20 text-warning text-xs px-2 py-1 rounded-md font-medium">
                {dashboard.pendingMaintenance} Pending
              </span>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="p-2 bg-warning/20 text-warning rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Maintenance Requests</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You have {dashboard.pendingMaintenance} unresolved maintenance tickets that require attention.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg flex-1">
            <h3 className="text-lg font-display font-bold text-foreground mb-4">Recent Transactions</h3>
            <div className="space-y-4">
              {dashboard.recentTransactions.length > 0 ? (
                dashboard.recentTransactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        tx.type === 'rent' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      )}>
                        {tx.type === 'rent' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground capitalize">{tx.type}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-bold text-sm",
                        tx.type === 'rent' ? "text-success" : "text-foreground"
                      )}>
                        {tx.type === 'rent' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <span className={cn("text-[10px] uppercase px-1.5 py-0.5 rounded-sm inline-block mt-1", getStatusColor(tx.status))}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">No recent transactions</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
