import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useGetVendorDashboard, useUpdateMaintenanceRequest } from "@workspace/api-client-react";
import { Wrench, Clock, CheckCircle, Activity } from "lucide-react";
import { formatDate, getStatusColor, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function VendorDashboard() {
  const { data: dashboard, isLoading } = useGetVendorDashboard();
  const { mutate: updateRequest, isPending: isUpdating } = useUpdateMaintenanceRequest();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleResolveJob = (jobId: number) => {
    updateRequest(
      { id: jobId, data: { status: 'resolved', resolvedAt: new Date().toISOString() } },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Job marked as resolved." });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/vendor"] });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update job status.", variant: "destructive" });
        }
      }
    );
  };

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
        title="Vendor Portal" 
        description="Manage your assigned maintenance jobs and track progress."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Assigned Jobs" 
          value={dashboard.assignedJobs.length} 
          icon={Wrench} 
        />
        <StatCard 
          title="Pending" 
          value={dashboard.pendingJobs} 
          icon={Clock} 
          className="border-warning/30 shadow-warning/10"
        />
        <StatCard 
          title="In Progress" 
          value={dashboard.inProgressJobs} 
          icon={Activity} 
          className="border-primary/30 shadow-primary/10"
        />
        <StatCard 
          title="Completed" 
          value={dashboard.completedJobs} 
          icon={CheckCircle} 
          className="border-success/30 shadow-success/10"
        />
      </div>

      <div className="mt-8 bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-border/50 glass-panel">
          <h3 className="text-lg font-display font-bold text-foreground">Current Assignments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Unit / Property</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date Assigned</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {dashboard.assignedJobs.map((job) => (
                <tr key={job.id} className="table-row-hover">
                  <td className="px-6 py-4 font-medium text-foreground">
                    {job.title}
                    {job.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{job.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    Unit {job.unit?.unitNumber}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold uppercase",
                      job.priority === 'urgent' ? 'bg-red-500/20 text-red-500' :
                      job.priority === 'high' ? 'bg-orange-500/20 text-orange-500' :
                      job.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-gray-500/20 text-gray-400'
                    )}>
                      {job.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider", getStatusColor(job.status))}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                    {formatDate(job.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {job.status !== 'resolved' && job.status !== 'cancelled' && (
                      <button
                        onClick={() => handleResolveJob(job.id)}
                        disabled={isUpdating}
                        className="px-3 py-1.5 bg-success/20 text-success hover:bg-success hover:text-success-foreground rounded-lg transition-colors text-xs font-semibold disabled:opacity-50"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {dashboard.assignedJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No active assignments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
