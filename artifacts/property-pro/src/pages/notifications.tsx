import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { useListNotifications } from "@workspace/api-client-react";
// Missing mark as read hook, will simulate for now or rely on refetch if endpoint existed
import { formatDate, cn } from "@/lib/utils";
import { Bell, Info, AlertTriangle, CheckCircle, XCircle, Check } from "lucide-react";

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  // Assume a mutation hook exists for mark as read, we just show UI for now

  const getIcon = (type: string) => {
    switch(type) {
      case 'info': return <Info className="w-5 h-5 text-blue-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getBgColor = (type: string, isRead: boolean) => {
    if (isRead) return "bg-card";
    switch(type) {
      case 'info': return "bg-blue-500/10 border-blue-500/20";
      case 'warning': return "bg-yellow-500/10 border-yellow-500/20";
      case 'success': return "bg-green-500/10 border-green-500/20";
      case 'error': return "bg-red-500/10 border-red-500/20";
      default: return "bg-white/5 border-white/10";
    }
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Notifications" 
        description="Stay updated with system alerts and activities."
      />

      <div className="max-w-3xl mx-auto mt-8">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <div className="space-y-4">
            {notifications?.map((notif) => (
              <div 
                key={notif.id} 
                className={cn(
                  "p-4 rounded-xl border flex gap-4 transition-colors",
                  getBgColor(notif.type, notif.isRead),
                  notif.isRead ? "border-border/50 opacity-75" : "shadow-lg"
                )}
              >
                <div className="shrink-0 mt-1">{getIcon(notif.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className={cn("font-semibold", notif.isRead ? "text-muted-foreground" : "text-foreground")}>
                      {notif.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>
                  <p className={cn("text-sm mt-1", notif.isRead ? "text-muted-foreground/80" : "text-muted-foreground")}>
                    {notif.message}
                  </p>
                </div>
                {!notif.isRead && (
                  <button className="shrink-0 self-center p-2 hover:bg-white/10 rounded-full text-muted-foreground hover:text-foreground transition-colors" title="Mark as read">
                    <Check className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            {notifications?.length === 0 && (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">You're all caught up!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
