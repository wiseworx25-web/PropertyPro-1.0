import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useGetAdminDashboard } from "@workspace/api-client-react";
import { Users, UserCheck, Wrench, Clock, Activity, FileText } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatDate } from "@/lib/utils";

const COLORS = {
  vacant: "hsl(var(--success))",
  occupied: "hsl(var(--primary))",
  maintenance: "hsl(var(--warning))"
};

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-8">
          <div className="h-12 w-64 bg-white/5 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[400px] bg-white/5 rounded-2xl" />
            <div className="h-[400px] bg-white/5 rounded-2xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!dashboard) return null;

  const pieData = [
    { name: "Vacant", value: dashboard.unitStatusBreakdown.vacant, color: COLORS.vacant },
    { name: "Occupied", value: dashboard.unitStatusBreakdown.occupied, color: COLORS.occupied },
    { name: "Maintenance", value: dashboard.unitStatusBreakdown.maintenance, color: COLORS.maintenance },
  ].filter(item => item.value > 0);

  return (
    <AppLayout>
      <PageHeader 
        title="Admin Overview" 
        description="Platform statistics, user activity, and system health."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Tenants" 
          value={dashboard.totalTenants} 
          icon={Users} 
        />
        <StatCard 
          title="Active Tenants" 
          value={dashboard.activeTenants} 
          icon={UserCheck} 
        />
        <StatCard 
          title="Total Vendors" 
          value={dashboard.totalVendors} 
          icon={Wrench} 
        />
        <StatCard 
          title="Pending Maintenance" 
          value={dashboard.pendingMaintenanceRequests} 
          icon={Clock} 
          className="border-warning/30 shadow-warning/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg lg:col-span-1">
          <h3 className="text-lg font-display font-bold text-foreground mb-6">Unit Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg lg:col-span-2 overflow-hidden flex flex-col">
          <h3 className="text-lg font-display font-bold text-foreground mb-4">Expiring Leases</h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tenant</th>
                  <th className="px-4 py-3 font-semibold">Unit</th>
                  <th className="px-4 py-3 font-semibold">End Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {dashboard.expiringLeases.slice(0, 5).map(lease => (
                  <tr key={lease.id} className="table-row-hover">
                    <td className="px-4 py-3 font-medium text-foreground">{lease.tenant?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-muted-foreground">Unit {lease.unit?.unitNumber}</td>
                    <td className="px-4 py-3 font-medium text-warning">{formatDate(lease.endDate)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-md text-xs font-semibold bg-warning/20 text-warning uppercase">Expiring</span>
                    </td>
                  </tr>
                ))}
                {dashboard.expiringLeases.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No leases expiring soon.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-border/50 flex items-center justify-between glass-panel">
          <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {dashboard.recentActivity.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="p-2 bg-primary/20 text-primary rounded-lg shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    <span className="text-primary">{log.user?.name || 'System'}</span> {log.action} {log.entity}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {log.details}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {dashboard.recentActivity.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
