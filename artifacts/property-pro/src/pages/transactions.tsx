import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { useListTransactions } from "@workspace/api-client-react";
import { formatCurrency, formatDate, getStatusColor, cn } from "@/lib/utils";
import { Download, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";

export default function Transactions() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: transactions, isLoading } = useListTransactions({
    type: typeFilter ? typeFilter as any : undefined,
    status: statusFilter ? statusFilter as any : undefined
  });

  const handleExportCSV = () => {
    if (!transactions) return;
    const headers = ["Date", "Description", "Type", "Amount", "Status", "Payment Method", "Reference"];
    const csvContent = [
      headers.join(","),
      ...transactions.map(t => 
        `"${formatDate(t.createdAt)}","${t.description || ''}","${t.type}","${t.amount}","${t.status}","${t.paymentMethod || ''}","${t.reference || ''}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalIncome = transactions?.filter(t => t.type === 'rent' || t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <PageHeader 
          title="Transactions" 
          description="View and manage all financial records."
        />
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-foreground rounded-lg font-medium transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard 
          title="Total Income (Filtered)" 
          value={formatCurrency(totalIncome)} 
          icon={ArrowDownRight} 
          className="border-success/30 shadow-success/10"
        />
        <StatCard 
          title="Total Expenses (Filtered)" 
          value={formatCurrency(totalExpenses)} 
          icon={ArrowUpRight} 
          className="border-destructive/30 shadow-destructive/10"
        />
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border/50 glass-panel flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 text-muted-foreground mr-auto">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <select 
            className="w-full sm:w-auto p-2 bg-input border border-border rounded-lg text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="rent">Rent</option>
            <option value="deposit">Deposit</option>
            <option value="expense">Expense</option>
            <option value="penalty">Penalty</option>
          </select>
          <select 
            className="w-full sm:w-auto p-2 bg-input border border-border rounded-lg text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="overflow-x-auto flex-1 min-h-[400px]">
          {isLoading ? (
            <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Method / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {transactions?.map((tx) => (
                  <tr key={tx.id} className="table-row-hover">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{formatDate(tx.createdAt)}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{tx.description || '-'}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className="flex items-center gap-1.5">
                        {tx.type === 'expense' ? <ArrowUpRight className="w-3 h-3 text-destructive" /> : <ArrowDownRight className="w-3 h-3 text-success" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className={cn(
                      "px-6 py-4 font-bold text-right",
                      tx.type === 'expense' ? "text-foreground" : "text-success"
                    )}>
                      {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider", getStatusColor(tx.status))}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      <div>{tx.paymentMethod || '-'}</div>
                      <div className="font-mono text-[10px] mt-0.5">{tx.reference}</div>
                    </td>
                  </tr>
                ))}
                {transactions?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No transactions found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
