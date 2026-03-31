import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { useListUnits, useCreateUnit, useListProperties } from "@workspace/api-client-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Home as HomeIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CreateUnitRequestTier, CreateUnitRequestStatus } from "@workspace/api-client-react";

export default function Units() {
  const { data: units, isLoading } = useListUnits();
  const { data: properties } = useListProperties();
  const { mutate: createUnit, isPending } = useCreateUnit();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    propertyId: "",
    unitNumber: "",
    tier: "entry_level" as CreateUnitRequestTier,
    monthlyRent: "",
    status: "vacant" as CreateUnitRequestStatus,
    bedrooms: "",
    bathrooms: "",
    size: ""
  });

  const getTierPrice = (tier: string) => {
    switch (tier) {
      case 'entry_level': return "R1,600";
      case 'small': return "R2,400";
      case 'medium': return "R3,800";
      default: return "-";
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'vacant': return 'bg-success/20 text-success';
      case 'occupied': return 'bg-primary/20 text-primary';
      case 'maintenance': return 'bg-warning/20 text-warning';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.propertyId || !formData.unitNumber || !formData.monthlyRent) return;

    createUnit(
      {
        data: {
          propertyId: Number(formData.propertyId),
          unitNumber: formData.unitNumber,
          tier: formData.tier,
          monthlyRent: Number(formData.monthlyRent),
          status: formData.status,
          bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
          size: formData.size ? Number(formData.size) : undefined,
        }
      },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Unit created successfully." });
          setIsOpen(false);
          queryClient.invalidateQueries({ queryKey: ["/api/units"] });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to create unit.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <PageHeader 
          title="Units Management" 
          description="Manage property units, rental tiers, and statuses."
        />
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Add Unit
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/50 text-foreground">
            <DialogHeader>
              <DialogTitle>Add New Unit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Property</label>
                <select 
                  className="w-full p-2.5 bg-input border border-border rounded-lg"
                  value={formData.propertyId}
                  onChange={(e) => setFormData({...formData, propertyId: e.target.value})}
                  required
                >
                  <option value="">Select Property...</option>
                  {properties?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit Number</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-2.5 bg-input border border-border rounded-lg"
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({...formData, unitNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monthly Rent</label>
                  <input 
                    type="number" 
                    required
                    className="w-full p-2.5 bg-input border border-border rounded-lg"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({...formData, monthlyRent: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tier</label>
                  <select 
                    className="w-full p-2.5 bg-input border border-border rounded-lg"
                    value={formData.tier}
                    onChange={(e) => setFormData({...formData, tier: e.target.value as any})}
                  >
                    <option value="entry_level">Entry Level</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select 
                    className="w-full p-2.5 bg-input border border-border rounded-lg"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="vacant">Vacant</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isPending}
                className="w-full mt-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending ? 'Creating...' : 'Create Unit'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Unit #</th>
                  <th className="px-6 py-4 font-semibold">Property</th>
                  <th className="px-6 py-4 font-semibold">Tier</th>
                  <th className="px-6 py-4 font-semibold">Monthly Rent</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {units?.map((unit) => (
                  <tr key={unit.id} className="table-row-hover group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                          <HomeIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-foreground">Unit {unit.unitNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{unit.property?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="capitalize">{unit.tier.replace('_', ' ')}</span>
                      <p className="text-xs text-muted-foreground">{getTierPrice(unit.tier)} base</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      {formatCurrency(unit.monthlyRent)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider", getStatusColor(unit.status))}>
                        {unit.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {units?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No units found. Create one to get started.
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
