import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { useListLeases } from "@workspace/api-client-react";
import { formatCurrency, formatDate, getStatusColor, cn } from "@/lib/utils";
import { FileText, Search, Filter } from "lucide-react";

export default function Leases() {
  const { data: leases = [], isLoading } = useListLeases();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLeases = leases.filter(l => 
    l.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.unit?.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader 
        title="Lease Management" 
        description="View and manage tenant lease agreements."
      />

      <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-border/50 glass-panel flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by tenant or unit..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-border rounded-xl text-sm font-medium hover:bg-white/10 transition-colors shrink-0">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Tenant</th>
                <th className="px-6 py-4 font-semibold">Unit</th>
                <th className="px-6 py-4 font-semibold">Term</th>
                <th className="px-6 py-4 font-semibold text-right">Rent</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading leases...</td></tr>
              ) : filteredLeases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No leases found.</p>
                  </td>
                </tr>
              ) : (
                filteredLeases.map(lease => (
                  <tr key={lease.id} className="table-row-hover cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border border-primary/30">
                          {lease.tenant?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{lease.tenant?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{lease.tenant?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">Unit {lease.unit?.unitNumber}</p>
                      <p className="text-xs text-muted-foreground capitalize">{lease.unit?.tier.replace('_', ' ')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-foreground">{formatDate(lease.startDate)}</p>
                      <p className="text-xs text-muted-foreground">to {formatDate(lease.endDate)}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">
                      {formatCurrency(lease.monthlyRent)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider inline-block", getStatusColor(lease.status))}>
                        {lease.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
