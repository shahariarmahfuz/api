'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  RefreshCw,
  Key,
  BarChart3,
  X,
  AlertTriangle,
  Loader2,
  Clock,
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // User Details Modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Action status message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter, page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers({
        search: search || undefined,
        role: roleFilter,
        status: statusFilter,
        page,
      });
      setUsers(res.data);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    if (!confirm(`Are you sure you want to change ${user.name}'s status to '${nextStatus}'?`)) {
      return;
    }
    setFeedback(null);
    try {
      await api.updateUserStatus(user.id, nextStatus);
      setFeedback({ type: 'success', message: `User status updated to ${nextStatus}.` });
      loadUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update user status.' });
    }
  };

  const handleChangeRole = async (user: any) => {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Are you sure you want to change ${user.name}'s role to '${nextRole}'?`)) {
      return;
    }
    setFeedback(null);
    try {
      await api.updateUserRole(user.id, nextRole);
      setFeedback({ type: 'success', message: `User role changed to ${nextRole}.` });
      loadUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update user role.' });
    }
  };

  const handleViewDetails = async (userId: string) => {
    setSelectedUserId(userId);
    setDetailsLoading(true);
    try {
      const res = await api.getAdminUserDetails(userId);
      setSelectedUserDetail(res.data);
    } catch (err: any) {
      alert(`Failed to load details: ${err.message}`);
      setSelectedUserId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">User Administration</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Platform accounts directory, role assignments, and account standing.
          </p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-[#0e1017]">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search users by name or email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs font-mono rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-zinc-700"
        >
          <option value="all">All Roles</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs font-mono rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-zinc-700"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500">
          Loading user records...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-[#0e1017]/40">
          <Users className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">No Users Found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            No registered users match your search or filter parameters.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-[#0e1017] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">API Keys</th>
                  <th className="py-3 px-4">Requests</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.map((u) => {
                  const isCurrentAdmin = currentAdmin?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-sans font-semibold text-zinc-200">{u.name}</div>
                        <div className="text-zinc-400 text-[11px] font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                            u.role === 'ADMIN'
                              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                            u.status === 'active'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-300 font-semibold">
                        {u.api_keys_count || 0}
                      </td>
                      <td className="py-3 px-4 text-zinc-300 font-semibold">
                        {u.requests_count ? u.requests_count.toLocaleString() : 0}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          {/* View details */}
                          <button
                            onClick={() => handleViewDetails(u.id)}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors text-[11px] flex items-center gap-1 px-2"
                            title="View User Details"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </button>

                          {/* Toggle Status (Active / Suspend) */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isCurrentAdmin}
                            className={`p-1 rounded text-[11px] px-2 flex items-center gap-1 transition-colors ${
                              isCurrentAdmin
                                ? 'opacity-30 cursor-not-allowed bg-zinc-800 text-zinc-500'
                                : u.status === 'active'
                                ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60'
                                : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
                            }`}
                            title={
                              isCurrentAdmin
                                ? 'Safeguard: Cannot suspend your own admin account'
                                : u.status === 'active'
                                ? 'Suspend user'
                                : 'Activate user'
                            }
                          >
                            {u.status === 'active' ? (
                              <>
                                <UserX className="w-3 h-3" />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>

                          {/* Toggle Role (Promote / Demote) */}
                          <button
                            onClick={() => handleChangeRole(u)}
                            disabled={isCurrentAdmin}
                            className={`p-1 rounded text-[11px] px-2 flex items-center gap-1 transition-colors ${
                              isCurrentAdmin
                                ? 'opacity-30 cursor-not-allowed bg-zinc-800 text-zinc-500'
                                : u.role === 'ADMIN'
                                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                : 'bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/60 border border-indigo-800/50'
                            }`}
                            title={
                              isCurrentAdmin
                                ? 'Safeguard: Cannot demote your own admin account'
                                : u.role === 'ADMIN'
                                ? 'Demote to USER'
                                : 'Promote to ADMIN'
                            }
                          >
                            <Shield className="w-3 h-3" />
                            <span>{u.role === 'ADMIN' ? 'Make User' : 'Make Admin'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>
                Showing page {page} of {totalPages} ({totalCount} total users)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-xl border border-zinc-800 bg-[#0e1017] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">User Inspection & Activity</h3>
              </div>
              <button
                onClick={() => setSelectedUserId(null)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6">
              {detailsLoading || !selectedUserDetail ? (
                <div className="py-12 text-center text-xs font-mono text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                  Loading comprehensive user telemetry...
                </div>
              ) : (
                <>
                  {/* Summary Profile */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-zinc-900/40 border border-zinc-800 text-xs font-mono">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">User Name</span>
                      <span className="text-white font-sans font-semibold">
                        {selectedUserDetail.user?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Email Address</span>
                      <span className="text-zinc-300">{selectedUserDetail.user?.email}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Role / Status</span>
                      <span className="text-zinc-200">
                        {selectedUserDetail.user?.role} • {selectedUserDetail.user?.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Total Requests</span>
                      <span className="text-emerald-400 font-bold">
                        {selectedUserDetail.total_requests?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>

                  {/* Owned API Keys */}
                  <div>
                    <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Associated API Keys ({selectedUserDetail.api_keys?.length || 0})</span>
                    </h4>
                    {!selectedUserDetail.api_keys || selectedUserDetail.api_keys.length === 0 ? (
                      <p className="text-xs font-mono text-zinc-500 italic p-3 border border-zinc-800 rounded-lg">
                        This user has not generated any API keys.
                      </p>
                    ) : (
                      <div className="rounded-lg border border-zinc-800 overflow-hidden">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-zinc-900/60 text-zinc-400">
                            <tr>
                              <th className="p-2.5">Key Name</th>
                              <th className="p-2.5">Prefix</th>
                              <th className="p-2.5">Status</th>
                              <th className="p-2.5">Created</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60">
                            {selectedUserDetail.api_keys.map((k: any) => (
                              <tr key={k.id}>
                                <td className="p-2.5 text-zinc-200 font-sans">{k.name}</td>
                                <td className="p-2.5 text-zinc-400">{k.key_prefix}••••••••</td>
                                <td className="p-2.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                                      k.status === 'active'
                                        ? 'bg-emerald-950/60 text-emerald-400'
                                        : 'bg-zinc-800 text-zinc-500'
                                    }`}
                                  >
                                    {k.status}
                                  </span>
                                </td>
                                <td className="p-2.5 text-zinc-400">
                                  {new Date(k.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Recent User Invocations</span>
                    </h4>
                    {!selectedUserDetail.recent_activity ||
                    selectedUserDetail.recent_activity.length === 0 ? (
                      <p className="text-xs font-mono text-zinc-500 italic p-3 border border-zinc-800 rounded-lg">
                        No recent API requests logged for this account.
                      </p>
                    ) : (
                      <div className="rounded-lg border border-zinc-800 overflow-hidden">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-zinc-900/60 text-zinc-400">
                            <tr>
                              <th className="p-2.5">Method</th>
                              <th className="p-2.5">Endpoint</th>
                              <th className="p-2.5">Status</th>
                              <th className="p-2.5">Latency</th>
                              <th className="p-2.5 text-right">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60">
                            {selectedUserDetail.recent_activity.map((r: any) => (
                              <tr key={r.id}>
                                <td className="p-2.5 font-bold text-zinc-300">{r.method}</td>
                                <td className="p-2.5 text-zinc-200">{r.endpoint}</td>
                                <td className="p-2.5">
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[10px]">
                                    {r.status_code}
                                  </span>
                                </td>
                                <td className="p-2.5 text-zinc-400">{r.response_time_ms} ms</td>
                                <td className="p-2.5 text-right text-zinc-500">
                                  {new Date(r.timestamp).toLocaleTimeString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
