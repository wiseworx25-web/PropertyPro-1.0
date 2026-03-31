import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { useListProperties, useCreateProperty, useDeleteProperty } from "@workspace/api-client-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Plus, Search, Building2, MapPin, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function Properties() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: properties = [], isLoading } = useListProperties();
  
  const createMutation = useCreateProperty({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/properties`] });
        setIsCreateOpen(false);
        toast({ title: "Property created successfully" });
      }
    }
  });

  const deleteMutation = useDeleteProperty({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/properties`] });
        toast({ title: "Property deleted" });
      }
    }
  });

  const filteredProperties = properties.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      data: {
        name: fd.get("name") as string,
        address: fd.get("address") as string,
        city: fd.get("city") as string,
        province: fd.get("province") as string,
        postalCode: fd.get("postalCode") as string,
        ownerId: user?.id || 1, // Fallback if no user
      }
    });
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Properties" 
        description="Manage your real estate portfolio."
        action={
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Add Property
          </button>
        }
      />

      <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 sm:p-6 border-b border-border/50 glass-panel flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search properties by name or city..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Property</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold text-center">Units</th>
                <th className="px-6 py-4 font-semibold text-center">Occupancy</th>
                <th className="px-6 py-4 font-semibold">Added</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading properties...</td></tr>
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No properties found.</p>
                  </td>
                </tr>
              ) : (
                filteredProperties.map(property => (
                  <tr key={property.id} className="table-row-hover group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{property.name}</p>
                          <p className="text-xs text-muted-foreground">ID: #{property.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1.5 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{property.address}, {property.city}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-foreground">
                      {property.totalUnits}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold">{property.occupiedUnits}/{property.totalUnits}</span>
                        <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              (property.occupiedUnits / (property.totalUnits || 1)) > 0.8 ? "bg-success" : "bg-primary"
                            )}
                            style={{ width: `${(property.occupiedUnits / (property.totalUnits || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(property.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-muted-foreground hover:text-primary bg-white/5 hover:bg-primary/10 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this property?')) {
                              deleteMutation.mutate({ id: property.id });
                            }
                          }}
                          className="p-2 text-muted-foreground hover:text-destructive bg-white/5 hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)}
        title="Add New Property"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Property Name</label>
            <input required name="name" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. Sunset Apartments" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Street Address</label>
            <input required name="address" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">City</label>
              <input required name="city" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Cape Town" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Province</label>
              <input required name="province" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Western Cape" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Postal Code</label>
            <input name="postalCode" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="8001" />
          </div>
          
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/50 mt-6">
            <button 
              type="button" 
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create Property"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
