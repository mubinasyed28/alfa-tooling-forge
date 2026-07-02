import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAllUsers, approveUser, rejectUser, revokeUser } from "@/lib/admin.functions";
import { UserCheck, UserX, RefreshCw, Shield, Clock, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({ component: UsersAdmin });

function roleBadge(role: string) {
  if (role === "super_admin")
    return (
      <span className="text-xs rounded px-2 py-0.5 bg-orange/20 text-orange font-semibold">
        Super Admin
      </span>
    );
  if (role === "editor")
    return (
      <span className="text-xs rounded px-2 py-0.5 bg-green-100 text-green-800 font-semibold">
        Editor
      </span>
    );
  return (
    <span className="text-xs rounded px-2 py-0.5 bg-yellow-100 text-yellow-700 font-semibold">
      Pending
    </span>
  );
}

function UsersAdmin() {
  const qc = useQueryClient();
  const doList = useServerFn(listAllUsers);
  const doApprove = useServerFn(approveUser);
  const doReject = useServerFn(rejectUser);
  const doRevoke = useServerFn(revokeUser);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => doList({ data: undefined } as any),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => doApprove({ data: { id } }),
    onSuccess: () => {
      toast.success("User approved as Editor");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => doReject({ data: { id } }),
    onSuccess: () => {
      toast.success("User removed");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => doRevoke({ data: { id } }),
    onSuccess: () => {
      toast.success("Access revoked");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const pending = (users as any[]).filter((u) => u.role === "pending");
  const active = (users as any[]).filter((u) => u.role !== "pending");

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-navy" />
        <h1 className="font-display text-2xl font-bold text-navy">User Management</h1>
      </div>

      {/* Pending Approvals */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-orange" />
          <h2 className="font-semibold text-navy">Pending Approvals ({pending.length})</h2>
        </div>
        {pending.length === 0 ? (
          <div className="bg-background border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            No pending users — all caught up! 🎉
          </div>
        ) : (
          <div className="bg-background border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Requested</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((u: any) => (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/50"
                  >
                    <td className="p-3 font-medium">{u.name || "—"}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approveMut.mutate(u.id)}
                          disabled={approveMut.isPending}
                          className="flex items-center gap-1.5 rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${u.email}?`)) rejectMut.mutate(u.id);
                          }}
                          disabled={rejectMut.isPending}
                          className="flex items-center gap-1.5 rounded border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <UserX className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Users */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-navy" />
          <h2 className="font-semibold text-navy">Active Users ({active.length})</h2>
        </div>
        {isLoading ? (
          <div className="bg-background border border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="bg-background border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Approved</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {active.map((u: any) => (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/50"
                  >
                    <td className="p-3 font-medium">{u.name || "—"}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">{roleBadge(u.role)}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {u.approved_at ? new Date(u.approved_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-3">
                      {u.role !== "super_admin" && (
                        <button
                          onClick={() => {
                            if (confirm(`Revoke access for ${u.email}?`)) revokeMut.mutate(u.id);
                          }}
                          disabled={revokeMut.isPending}
                          className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                        >
                          <RefreshCw className="h-3 w-3" /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
