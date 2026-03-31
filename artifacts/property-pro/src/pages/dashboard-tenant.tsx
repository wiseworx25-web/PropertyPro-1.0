import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { useGetTenantDashboard } from "@workspace/api-client-react";
import { formatCurrency, formatDate, getStatusColor, cn } from "@/lib/utils";
import { Calendar, CreditCard, Wrench, AlertCircle, Home as HomeIcon, Download, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function TenantDashboard() {
  const { data: dashboard, isLoading } = useGetTenantDashboard();

  const handlePayRent = () => {
    // Requirements: Paystack integration via external link
    window.open('https://paystack.shop/pay/nscrent', '_blank');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-8">
          <div className="h-12 w-64 bg-white/5 rounded-lg" />
          <div className="h-[300px] bg-white/5 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!dashboard) return null;

  const { activeLease, unit, paymentHistory, maintenanceRequests } = dashboard;

  return (
    <AppLayout>
      <PageHeader 
        title="Tenant Portal" 
        description="Manage your lease, pay rent, and request maintenance."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Lease & Payment */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Lease Hero Card */}
          {activeLease && unit ? (
            <div className="bg-gradient-to-br from-card to-card/50 rounded-3xl border border-primary/20 p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <HomeIcon className="w-48 h-48" />
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/20 text-success text-xs font-bold uppercase tracking-wide mb-4 border border-success/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Active Lease
                  </div>
                  <h2 className="text-4xl font-display font-bold text-foreground mb-2">Unit {unit.unitNumber}</h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <span className="capitalize">{unit.tier.replace('_', ' ')} Tier</span> • 
                    <span>{unit.bedrooms} Bed, {unit.bathrooms} Bath</span>
                  </p>
                  
                  <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Rent</p>
                      <p className="text-xl font-semibold text-foreground">{formatCurrency(activeLease.monthlyRent)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lease Ends</p>
                      <p className="text-xl font-semibold text-foreground">{formatDate(activeLease.endDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-background/50 backdrop-blur-md rounded-2xl p-6 border border-white/10 md:w-64 text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Next Payment Due</p>
                  <p className="text-3xl font-display font-bold text-primary mb-1">
                    {dashboard.nextPaymentDue ? formatDate(dashboard.nextPaymentDue) : "Up to date"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {dashboard.nextPaymentAmount ? formatCurrency(dashboard.nextPaymentAmount) : formatCurrency(activeLease.monthlyRent)}
                  </p>
                  
                  <button 
                    onClick={handlePayRent}
                    className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Pay Rent Now
                  </button>
                  <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                    Secure payment via Paystack
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border/50 p-12 text-center shadow-lg">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Active Lease</h3>
              <p className="text-muted-foreground">You do not have an active lease assigned to your account.</p>
            </div>
          )}

          {/* Payment History */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-border/50 flex items-center justify-between glass-panel">
              <h3 className="text-lg font-display font-bold text-foreground">Recent Payments</h3>
              <Link href="/transactions" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {paymentHistory.slice(0, 5).map((tx) => (
                    <tr key={tx.id} className="table-row-hover">
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{tx.description || 'Rent Payment'}</td>
                      <td className="px-6 py-4 font-bold">{formatCurrency(tx.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider", getStatusColor(tx.status))}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tx.status === 'completed' && (
                          <button className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/10">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paymentHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No payment history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Maintenance & Info */}
        <div className="space-y-8">
          
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-border/50 glass-panel">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-display font-bold text-foreground">Maintenance</h3>
                <Link href="/maintenance" className="text-primary text-sm hover:underline font-medium">View All</Link>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <Link 
                href="/maintenance"
                className="w-full block text-center py-2.5 px-4 rounded-xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 font-medium"
              >
                + New Request
              </Link>
              
              <div className="space-y-3 mt-6">
                {maintenanceRequests.slice(0, 4).map((req) => (
                  <div key={req.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{req.title}</h4>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded uppercase font-bold", getStatusColor(req.status))}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{req.description}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(req.createdAt)}
                    </p>
                  </div>
                ))}
                {maintenanceRequests.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent requests.</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-6">
            <h3 className="text-lg font-display font-bold text-foreground mb-4">Rental Tiers Guide</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                <span className="text-sm font-medium text-muted-foreground">Entry Level</span>
                <span className="font-bold text-foreground">R1,600/mo</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                <span className="text-sm font-medium text-muted-foreground">Small Unit</span>
                <span className="font-bold text-foreground">R2,400/mo</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-primary/20">
                <span className="text-sm font-medium text-primary">Medium Unit</span>
                <span className="font-bold text-primary">R3,800/mo</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
