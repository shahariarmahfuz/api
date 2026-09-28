'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Layers,
  Key,
  ListOrdered,
  Database,
  CheckCircle2,
  TrendingUp,
  Clock,
  RefreshCw,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MethodBadge } from '@/components/Badge';

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOverview();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Telemetry & Overview</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Platform-wide metrics, active user registrations, and request throughput.
          </p>
        </div>
        <button
          onClick={loadOverview}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#080808] text-xs font-mono text-zinc-300 hover:text-white hover:bg-[#121212] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs font-mono text-zinc-500">
          Aggregating platform telemetry...
        </div>
      ) : !data ? (
        <div className="p-12 text-center text-xs text-rose-400 font-mono">
          Failed to load administration overview.
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#050505]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Total Users</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-white">
                {data.total_users?.toLocaleString() || 0}
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                <span className="text-emerald-400">{data.active_users || 0}</span> active accounts
              </div>
            </div>

            {/* Total Platform APIs */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#050505]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Registered APIs</span>
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-white">
                {data.total_apis?.toLocaleString() || 0}
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                <span className="text-emerald-400">{data.active_apis || 0}</span> published in catalog
              </div>
            </div>

            {/* Platform Requests */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#050505]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Total API Requests</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-white">
                {data.total_requests?.toLocaleString() || 0}
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                <span className="text-cyan-400">{data.requests_today || 0}</span> recorded today
              </div>
            </div>

            {/* Active API Keys */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#050505]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Active API Keys</span>
                <Key className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-white">
                {data.total_keys?.toLocaleString() || 0}
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                SHA-256 hashed secrets
              </div>
            </div>
          </div>

          {/* Database Health Card */}
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#050505] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#080808] border border-white/[0.08] flex items-center justify-center text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">PostgreSQL Neon Database</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Engine: SQLAlchemy 2.x • Driver: {data.database?.driver || 'asyncpg'} • SSL Required
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-zinc-500 block text-[10px]">Ping Latency</span>
                <span className="text-zinc-200">
                  {data.database?.latency_ms ? `${data.database.latency_ms} ms` : '< 15 ms'}
                </span>
              </div>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Operational</span>
              </span>
            </div>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/admin/users"
              className="p-4 rounded-xl border border-white/[0.08] bg-[#050505] hover:border-white/[0.16] hover:bg-[#080808] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xs font-semibold text-white">Manage Users</h4>
              <p className="text-[11px] text-zinc-500 mt-1">
                View accounts, promote admins, or suspend suspicious users.
              </p>
            </Link>

            <Link
              href="/admin/apis"
              className="p-4 rounded-xl border border-white/[0.08] bg-[#050505] hover:border-white/[0.16] hover:bg-[#080808] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xs font-semibold text-white">API Registry</h4>
              <p className="text-[11px] text-zinc-500 mt-1">
                Enable, disable, or register platform API endpoints.
              </p>
            </Link>

            <Link
              href="/admin/requests"
              className="p-4 rounded-xl border border-white/[0.08] bg-[#050505] hover:border-white/[0.16] hover:bg-[#080808] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <ListOrdered className="w-4 h-4 text-cyan-400" />
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xs font-semibold text-white">Audit Logs</h4>
              <p className="text-[11px] text-zinc-500 mt-1">
                Inspect cross-tenant HTTP requests, status codes, and latencies.
              </p>
            </Link>
          </div>

          {/* Recent Activity Table */}
          <div className="rounded-xl border border-white/[0.08] bg-[#050505] overflow-hidden">
            <div className="p-4 border-b border-white/[0.06] bg-[#080808] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Recent Platform Traffic</h3>
              </div>
              <Link
                href="/admin/requests"
                className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <span>View Full Log</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {!data.recent_activity || data.recent_activity.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                No recent request activity recorded on platform.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-[#080808] text-zinc-400">
                      <th className="py-2.5 px-4">Method</th>
                      <th className="py-2.5 px-4">Endpoint</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Latency</th>
                      <th className="py-2.5 px-4">User</th>
                      <th className="py-2.5 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {data.recent_activity.map((act: any) => (
                      <tr key={act.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-4">
                          <MethodBadge method={act.method} />
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-zinc-200">{act.endpoint}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              act.status_code < 300
                                ? 'bg-emerald-950/60 text-emerald-400'
                                : act.status_code < 500
                                ? 'bg-amber-950/60 text-amber-400'
                                : 'bg-rose-950/60 text-rose-400'
                            }`}
                          >
                            {act.status_code}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-zinc-400">{act.response_time_ms} ms</td>
                        <td className="py-2.5 px-4 text-zinc-400">
                          {act.user_id ? `${act.user_id.slice(0, 8)}...` : 'Public/Anon'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-zinc-500">
                          {new Date(act.timestamp).toLocaleTimeString()}
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
  );
}
