import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/lib/auth";

// Pages
import Login from "@/pages/login";
import OwnerDashboard from "@/pages/dashboard-owner";
import TenantDashboard from "@/pages/dashboard-tenant";
import Properties from "@/pages/properties";
import Leases from "@/pages/leases";

import AdminDashboard from "@/pages/dashboard-admin";
import VendorDashboard from "@/pages/dashboard-vendor";
import Units from "@/pages/units";
import Transactions from "@/pages/transactions";
import Maintenance from "@/pages/maintenance";
import Users from "@/pages/users";
import Audit from "@/pages/audit";
import Notifications from "@/pages/notifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  }
});

// Protected Route Wrapper
function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType<any>, allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Redirect to="/" />; // Or unauthorized page
  }

  return <Component />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Dynamic Root Redirect based on Auth */}
      <Route path="/">
        {() => {
          if (!user) return <Redirect to="/login" />;
          switch(user.role) {
            case 'owner': return <Redirect to="/dashboard/owner" />;
            case 'admin': return <Redirect to="/dashboard/admin" />;
            case 'tenant': return <Redirect to="/dashboard/tenant" />;
            case 'vendor': return <Redirect to="/dashboard/vendor" />;
            default: return <Redirect to="/login" />;
          }
        }}
      </Route>

      {/* Dashboards */}
      <Route path="/dashboard/owner">
        {() => <ProtectedRoute component={OwnerDashboard} allowedRoles={['owner', 'admin']} />}
      </Route>
      <Route path="/dashboard/admin">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={['admin', 'owner']} />}
      </Route>
      <Route path="/dashboard/tenant">
        {() => <ProtectedRoute component={TenantDashboard} allowedRoles={['tenant']} />}
      </Route>
      <Route path="/dashboard/vendor">
        {() => <ProtectedRoute component={VendorDashboard} allowedRoles={['vendor']} />}
      </Route>

      {/* Resources */}
      <Route path="/properties">
        {() => <ProtectedRoute component={Properties} allowedRoles={['owner', 'admin']} />}
      </Route>
      <Route path="/leases">
        {() => <ProtectedRoute component={Leases} allowedRoles={['owner', 'admin']} />}
      </Route>
      
      {/* Stubs */}
      <Route path="/units"><ProtectedRoute component={Units} /></Route>
      <Route path="/tenants"><ProtectedRoute component={Users} /></Route>
      <Route path="/transactions"><ProtectedRoute component={Transactions} /></Route>
      <Route path="/maintenance"><ProtectedRoute component={Maintenance} /></Route>
      <Route path="/users"><ProtectedRoute component={Users} /></Route>
      <Route path="/audit"><ProtectedRoute component={Audit} /></Route>
      <Route path="/notifications"><ProtectedRoute component={Notifications} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
