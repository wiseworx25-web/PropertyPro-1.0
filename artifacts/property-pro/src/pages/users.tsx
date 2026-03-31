import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { useListUsers, useCreateUser } from "@workspace/api-client-react";
import { ShieldCheck, User, Plus, Filter, Mail, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CreateUserRequestRole } from "@workspace/api-client-react";
import { formatDate } from "@/lib/utils";

export default function Users() {
  const [roleFilter, setRoleFilter] = useState<string>("");
  const { data: users, isLoading } = useListUsers({ role: roleFilter ? roleFilter as any : undefined });
  const { mutate: createUser, isPending } = useCreateUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "tenant" as CreateUserRequestRole,
    phone: ""
  });

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      owner: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      tenant: "bg-green-500/20 text-green-400 border-green-500/30",
      vendor: "bg-orange-500/20 text-orange-400 border-orange-500/30"
    };
    return colors[role] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser(
      { data: formData },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "User created successfully." });
          setIsOpen(false);
          setFormData({ name: "", email: "", password: "", role: "tenant", phone: "" });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message || "Failed to create user.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <PageHeader 
          title="Users & Roles" 
          description="Manage system access, roles, and user information."
        />
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Add User
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/50 text-foreground">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input required type="text" className="w-full p-2.5 bg-input border border-border rounded-lg"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <input required type="email" className="w-full p-2.5 bg-input border border-border rounded-lg"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Temporary Password</label>
                <input required type="password" minLength={6} className="w-full p-2.5 bg-input border border-border rounded-lg"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select className="w-full p-2.5 bg-input border border-border rounded-lg"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                    <option value="tenant">Tenant</option>
                    <option value="vendor">Vendor</option>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <input type="tel" className="w-full p-2.5 bg-input border border-border rounded-lg"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <button type="submit" disabled={isPending} className="w-full mt-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50">
                {isPending ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border/50 glass-panel flex gap-4 items-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
          </div>
          <select 
            className="w-full sm:w-auto p-2 bg-input border border-border rounded-lg text-sm"
            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admins</option>
            <option value="owner">Owners</option>
            <option value="tenant">Tenants</option>
            <option value="vendor">Vendors</option>
          </select>
        </div>

        <div className="overflow-x-auto flex-1 min-h-[400px]">
          {isLoading ? (
            <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Contact Info</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {users?.map((u) => (
                  <tr key={u.id} className="table-row-hover">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-foreground border border-white/5">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{u.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5"><Mail className="w-3 h-3"/> {u.email}</div>
                        {u.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3"/> {u.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <span className="flex items-center gap-1.5 text-success text-xs font-medium"><div className="w-2 h-2 rounded-full bg-success animate-pulse"/> Active</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium"><div className="w-2 h-2 rounded-full bg-muted-foreground"/> Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
