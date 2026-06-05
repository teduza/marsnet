import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Plus,
  Shield,
  UserCheck,
  UserX,
  ChevronDown,
  Search,
  Users,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type UserRow = {
  id: number;
  openId: string;
  name: string | null;
  displayName: string | null;
  email: string | null;
  department: string | null;
  position: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  isOnline: boolean;
  lastSeenAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  lastSignedIn: Date;
};

type CreateForm = {
  openId: string;
  name: string;
  email: string;
  displayName: string;
  department: string;
  position: string;
  role: "user" | "admin";
};

const defaultForm: CreateForm = {
  openId: "",
  name: "",
  email: "",
  displayName: "",
  department: "",
  position: "",
  role: "user",
};

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState<CreateForm>(defaultForm);
  const [editForm, setEditForm] = useState<Partial<CreateForm>>({});

  const utils = trpc.useUtils();

  const { data: users = [], isLoading } = trpc.admin.listUsers.useQuery();

  const createMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      setShowCreate(false);
      setForm(defaultForm);
      utils.admin.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success("User updated");
      setEditUser(null);
      utils.admin.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const activateMutation = trpc.admin.activateUser.useMutation({
    onSuccess: () => {
      toast.success("User activated");
      utils.admin.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deactivateMutation = trpc.admin.deactivateUser.useMutation({
    onSuccess: () => {
      toast.success("User deactivated");
      utils.admin.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const promoteMutation = trpc.admin.promoteToAdmin.useMutation({
    onSuccess: () => {
      toast.success("User promoted to admin");
      utils.admin.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const demoteMutation = trpc.admin.demoteToUser.useMutation({
    onSuccess: () => {
      toast.success("Admin demoted to user");
      utils.admin.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (users as UserRow[]).filter(u => {
    const q = search.toLowerCase();
    return (
      (u.displayName || u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.department || "").toLowerCase().includes(q)
    );
  });

  const stats = {
    total: (users as UserRow[]).length,
    active: (users as UserRow[]).filter(u => u.isActive).length,
    online: (users as UserRow[]).filter(u => u.isOnline).length,
    admins: (users as UserRow[]).filter(u => u.role === "admin").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setLocation("/")}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-base font-semibold">Admin Panel</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              Signed in as {user?.name}
            </span>
            <Button
              size="sm"
              onClick={() => setShowCreate(true)}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New User
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Users", value: stats.total, icon: Users },
            { label: "Active", value: stats.active, icon: UserCheck },
            { label: "Online Now", value: stats.online, icon: UserCheck },
            { label: "Admins", value: stats.admins, icon: Shield },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users by name, email, department…"
            className="pl-9"
          />
        </div>

        {/* Users table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Last Seen</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      No users found
                    </td>
                  </tr>
                )}
                {filtered.map(u => (
                  <tr
                    key={u.id}
                    className={cn(
                      "border-b border-border/50 hover:bg-secondary/20 transition-colors",
                      !u.isActive && "opacity-50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={u.name}
                          displayName={u.displayName}
                          avatarUrl={u.avatarUrl}
                          isOnline={u.isOnline}
                          showStatus
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {u.displayName || u.name || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{u.email || u.openId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {u.department || "—"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                          u.role === "admin"
                            ? "bg-primary/15 text-primary"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {u.role === "admin" && <Shield className="w-3 h-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {u.isOnline
                        ? <span className="text-emerald-500">● Online</span>
                        : u.lastSeenAt
                        ? new Date(u.lastSeenAt).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
                          u.isActive
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-destructive/15 text-destructive"
                        )}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setEditForm({
                              displayName: u.displayName || "",
                              department: u.department || "",
                              position: u.position || "",
                              role: u.role,
                            });
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-xs"
                          title="Edit"
                        >
                          Edit
                        </button>
                        {u.isActive ? (
                          <button
                            onClick={() => deactivateMutation.mutate({ userId: u.id })}
                            disabled={u.id === user?.id}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
                            title="Deactivate"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => activateMutation.mutate({ userId: u.id })}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                            title="Activate"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {u.role !== "admin" ? (
                          <button
                            onClick={() => promoteMutation.mutate({ userId: u.id })}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Promote to Admin"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => demoteMutation.mutate({ userId: u.id })}
                            disabled={u.id === user?.id}
                            className="p-1.5 rounded-lg text-primary hover:text-muted-foreground hover:bg-accent transition-colors disabled:opacity-30"
                            title="Demote to User"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
              The user must have a Manus account. Their OpenID is required to grant access.
            </p>
            <FormField label="Manus OpenID *" required>
              <Input
                value={form.openId}
                onChange={e => setForm(f => ({ ...f, openId: e.target.value }))}
                placeholder="user_xxxxxxxxxxxxxxxx"
              />
            </FormField>
            <FormField label="Full Name *" required>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Smith"
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="john@company.com"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Department">
                <Input
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="Engineering"
                />
              </FormField>
              <FormField label="Position">
                <Input
                  value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                  placeholder="Engineer"
                />
              </FormField>
            </div>
            <FormField label="Role">
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as "user" | "admin" }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="user">User</option>
                <option value="admin">Administrator</option>
              </select>
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({
                openId: form.openId,
                name: form.name,
                email: form.email || undefined,
                displayName: form.displayName || undefined,
                department: form.department || undefined,
                position: form.position || undefined,
                role: form.role,
              })}
              disabled={!form.openId || !form.name || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={v => !v && setEditUser(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 bg-secondary/30 rounded-lg px-3 py-2">
                <UserAvatar name={editUser.name} displayName={editUser.displayName} size="sm" />
                <div>
                  <p className="text-sm font-medium">{editUser.displayName || editUser.name}</p>
                  <p className="text-xs text-muted-foreground">{editUser.email}</p>
                </div>
              </div>
              <FormField label="Display Name">
                <Input
                  value={editForm.displayName ?? ""}
                  onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="Display name"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Department">
                  <Input
                    value={editForm.department ?? ""}
                    onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                  />
                </FormField>
                <FormField label="Position">
                  <Input
                    value={editForm.position ?? ""}
                    onChange={e => setEditForm(f => ({ ...f, position: e.target.value }))}
                  />
                </FormField>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
              onClick={() => editUser && updateMutation.mutate({
                userId: editUser.id,
                displayName: editForm.displayName || undefined,
                department: editForm.department || undefined,
                position: editForm.position || undefined,
              })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
