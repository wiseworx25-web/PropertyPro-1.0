import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { 
  useListMaintenanceRequests, 
  useListUsers, 
  useUpdateMaintenanceRequest,
  useCreateMaintenanceRequest 
} from "@workspace/api-client-react";
import { formatDate, getStatusColor, cn } from "@/lib/utils";
import { Wrench, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CreateMaintenanceRequestPriority } from "@workspace/api-client-react";

export default function Maintenance() {
  const { user } = useAuth();
  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';
  const isTenant = user?.role === 'tenant';

  const { data: requests, isLoading } = useListMaintenanceRequests();
  const { data: vendors } = useListUsers({ role: 'vendor' }, { query: { enabled: isAdminOrOwner } });
  
  const { mutate: updateRequest } = useUpdateMaintenanceRequest();
  const { mutate: createRequest, isPending: isCreating } = useCreateMaintenanceRequest();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "low" as CreateMaintenanceRequestPriority,
    unitId: "" // In a real app, this would be selected or auto-filled for tenant
  });

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'low': return 'bg-slate-500/20 text-slate-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500';
      case 'high': return 'bg-orange-500/20 text-orange-500';
      case 'urgent': return 'bg-red-500/20 text-red-500';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const handleAssignVendor = (requestId: number, vendorId: string) => {
    if (!vendorId) return;
    updateRequest(
      { id: requestId, data: { vendorId: Number(vendorId), status: 'in_progress' } },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Vendor assigned successfully." });
          queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
        },
        onError: () => toast({ title: "Error", description: "Failed to assign vendor.", variant: "destructive" })
      }
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title || !formData.description) return;
    
    // Quick hack for demo to ensure it creates - normally unitId comes from tenant dashboard data
    const payload = {
      tenantId: user.id,
      unitId: formData.unitId ? Number(formData.unitId) : 1, // Fallback to 1 for demo
      title: formData.title,
      description: formData.description,
      priority: formData.priority
    };

    createRequest(
      { data: payload },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Request submitted." });
          setIsCreateOpen(false);
          setFormData({ ...formData, title: "", description: "" });
          queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message || "Failed to submit.", variant: "destructive" })
      }
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <PageHeader 
          title="Maintenance Requests" 
          description={isAdminOrOwner ? "Manage and assign property maintenance tickets." : "Submit and track your maintenance requests."}
        />
        
        {isTenant && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg">
                <Plus className="w-4 h-4" /> New Request
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50">
              <DialogHeader>
                <DialogTitle>Submit Maintenance Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issue Title</label>
                  <input 
                    required type="text" 
                    className="w-full p-2.5 bg-input border border-border rounded-lg"
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Leaking faucet"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea 
                    required className="w-full p-2.5 bg-input border border-border rounded-lg min-h-[100px]"
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the issue in detail..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select 
                    className="w-full p-2.5 bg-input border border-border rounded-lg"
                    value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}
                  >
                    <option value="low">Low - General maintenance</option>
                    <option value="medium">Medium - Needs attention soon</option>
                    <option value="high">High - Causing inconvenience</option>
                    <option value="urgent">Urgent - Emergency / Damage risk</option>
                  </select>
                </div>
                <button 
                  type="submit" disabled={isCreating}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {isCreating ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden flex flex-col min-h-[500px]">
        {isLoading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Issue</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Unit & Tenant</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  {isAdminOrOwner && <th className="px-6 py-4 font-semibold">Vendor Assignment</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {requests?.map((req) => (
                  <tr key={req.id} className="table-row-hover">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-muted-foreground" />
                        {req.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-[200px]">{req.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", getPriorityColor(req.priority))}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider", getStatusColor(req.status))}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">Unit {req.unit?.unitNumber || '-'}</div>
                      <div className="text-xs text-muted-foreground">{req.tenant?.name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {formatDate(req.createdAt)}
                    </td>
                    {isAdminOrOwner && (
                      <td className="px-6 py-4">
                        {req.status === 'resolved' || req.status === 'cancelled' ? (
                          <span className="text-muted-foreground text-xs">{req.vendor?.name || 'Unassigned'}</span>
                        ) : (
                          <select 
                            className="w-full min-w-[140px] p-1.5 bg-input border border-border rounded text-xs"
                            value={req.vendorId || ""}
                            onChange={(e) => handleAssignVendor(req.id, e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {vendors?.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {requests?.length === 0 && (
                  <tr>
                    <td colSpan={isAdminOrOwner ? 6 : 5} className="px-6 py-12 text-center text-muted-foreground">
                      No maintenance requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
