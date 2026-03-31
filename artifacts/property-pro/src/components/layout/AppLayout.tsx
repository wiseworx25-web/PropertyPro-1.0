import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import wiseworxLogo from "@assets/wiseworxlogo_1774862605471.png";
import { 
  LayoutDashboard, 
  Building2, 
  Home as HomeIcon, 
  FileText, 
  Users, 
  CreditCard, 
  Wrench, 
  LogOut,
  Bell,
  Menu,
  X,
  ShieldAlert,
  Settings
} from "lucide-react";
import { useListNotifications } from "@workspace/api-client-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: "Owner Dashboard", href: "/dashboard/owner", icon: LayoutDashboard, roles: ["owner"] },
  { label: "Admin Dashboard", href: "/dashboard/admin", icon: LayoutDashboard, roles: ["admin"] },
  { label: "Tenant Dashboard", href: "/dashboard/tenant", icon: LayoutDashboard, roles: ["tenant"] },
  { label: "Vendor Dashboard", href: "/dashboard/vendor", icon: LayoutDashboard, roles: ["vendor"] },
  
  { label: "Properties", href: "/properties", icon: Building2, roles: ["owner", "admin"] },
  { label: "Units", href: "/units", icon: HomeIcon, roles: ["owner", "admin"] },
  { label: "Leases", href: "/leases", icon: FileText, roles: ["owner", "admin"] },
  { label: "Tenants", href: "/tenants", icon: Users, roles: ["admin", "owner"] },
  
  { label: "Transactions", href: "/transactions", icon: CreditCard, roles: ["owner", "admin", "tenant"] },
  { label: "Maintenance", href: "/maintenance", icon: Wrench, roles: ["owner", "admin", "tenant", "vendor"] },
  
  { label: "Users & Roles", href: "/users", icon: Settings, roles: ["admin"] },
  { label: "Audit Logs", href: "/audit", icon: ShieldAlert, roles: ["owner", "admin"] },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { data: notifications } = useListNotifications({
    query: { enabled: !!user }
  });
  
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  if (!user) return null;

  const allowedNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 flex flex-col glass-panel border-r border-border transition-transform duration-300 lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-20 items-center justify-between px-6 border-b border-border/50">
          <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm">
            <img src={wiseworxLogo} alt="Wiseworx Logo" className="h-7 object-contain" />
          </div>
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <p className="px-2 mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</p>
          {allowedNavItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group font-medium",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-white/5">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-20 flex items-center justify-between px-6 glass-panel border-b border-border/50 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-muted-foreground hover:text-foreground p-2 -ml-2 rounded-lg hover:bg-white/5"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-display font-semibold text-foreground hidden sm:block">
              {allowedNavItems.find(i => location.startsWith(i.href))?.label || "Property Pro"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/notifications" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/5">
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-primary rounded-full ring-2 ring-background animate-pulse" />
              )}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {children}
          </div>
          
          {/* Footer inside scrolling area */}
          <footer className="mt-12 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground pb-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded px-2 py-1">
                <img src={wiseworxLogo} alt="Wiseworx" className="h-4 object-contain" />
              </div>
              <span>&copy; {new Date().getFullYear()} Property Pro.</span>
            </div>
            <p>Enterprise Property Management</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
