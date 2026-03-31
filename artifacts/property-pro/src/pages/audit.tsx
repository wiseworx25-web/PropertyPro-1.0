import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { useListAuditLogs } from "@workspace/api-client-react";
import { formatDate } from "@/lib/utils";
import { ShieldAlert, Activity, Database } from "lucide-react";

export default function Audit() {
  const { data: logs, isLoading } = useListAuditLogs();

  return (
    <AppLayout>
      <PageHeader 
        title="Audit Logs" 
        description="Immutable system activity and security records."
      />

      <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-border/50 glass-panel flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">System Activity</h3>
        </div>

        <div className="overflow-x-auto flex-1">
          {isLoading ? (
            <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Entity</th>
                  <th className="px-6 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-mono text-xs">
                {logs?.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-foreground font-sans">
                      {log.user?.name || `System (ID: ${log.userId || 'N/A'})`}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded font-bold uppercase tracking-wider">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground flex items-center gap-1.5 mt-2.5">
                      <Database className="w-3 h-3" /> {log.entity} #{log.entityId}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate" title={log.details || ''}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
                {logs?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-sans text-sm">
                      No audit records found.
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
