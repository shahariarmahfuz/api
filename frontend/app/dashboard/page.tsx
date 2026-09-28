'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Key,
  Layers,
  Zap,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { MethodBadge } from '@/components/Badge';

export default function UserDashboardOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserOverview();
  }, []);

  const loadUserOverview = async () => {
    try {
      const res = await api.getMyUsageStats();
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Developer Overview
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Welcome back, <strong className="text-zinc-200">{user?.name}</strong>. Here is your personal API telemetry.
          </p>
        </div>
        <Link
          href="/dashboard/api-keys"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-white transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New API Key</span>
        </Link>
      </div>

      {/* Telemetry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Requests</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {stats ? stats.total_requests : '0'}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Across all your keys
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Requests Today</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {stats ? stats.requests_today : '0'}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            UTC midnight to now
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">My API Keys</span>
            <Key className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {stats ? stats.api_keys_count : '0'}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Active tokens
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active APIs</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {stats ? stats.active_apis_count : '6'}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Available in catalog
          </span>
        </div>
      </div>

      {/* Recent API Activity (Strictly user's own activity) */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-[#0e1017] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Recent API Activity</h2>
            <p className="text-xs text-zinc-400">Latest requests executed with your API keys.</p>
          </div>
          <Link
            href="/dashboard/logs"
            className="flex items-center gap-1 text-xs font-mono text-emerald-400 hover:underline"
          >
            <span>Full Logs</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {!stats || stats.recent_activity.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800/80 rounded-lg">
            <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-zinc-300">No requests recorded yet</h3>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-xs mx-auto">
              Create an API key and send a test request from the catalog or terminal to view real telemetry here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Endpoint</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Latency</th>
                  <th className="pb-2 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {stats.recent_activity.map((log: any) => (
                  <tr key={log.id} className="hover:bg-zinc-900/40">
                    <td className="py-2.5">
                      <MethodBadge method={log.method} />
                    </td>
                    <td className="py-2.5 text-zinc-200 font-semibold">{log.endpoint}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          log.status_code < 300
                            ? 'bg-emerald-950/60 text-emerald-400'
                            : 'bg-rose-950/60 text-rose-400'
                        }`}
                      >
                        {log.status_code}
                      </span>
                    </td>
                    <td className="py-2.5 text-zinc-400">{log.response_time_ms} ms</td>
                    <td className="py-2.5 text-right text-zinc-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
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
