'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Layers,
  Key,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MethodBadge } from '@/components/Badge';

export default function DashboardUsagePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    setLoading(true);
    try {
      const res = await api.getMyUsageStats();
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const successRate =
    stats && stats.total_requests > 0
      ? Math.round((stats.success_requests / stats.total_requests) * 100)
      : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">API Usage & Analytics</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Real usage telemetry scoped to your authenticated account and API keys.
          </p>
        </div>
        <button
          onClick={loadUsageStats}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs font-mono text-zinc-500">
          Loading account usage analytics...
        </div>
      ) : !stats || stats.total_requests === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-[#0e1017]/40">
          <BarChart3 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">No Request Activity Yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto mb-6">
            Make requests using your API key or through the API playground to view real-time latency distributions and endpoint analytics.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard/api-keys"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Get API Key</span>
            </Link>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-medium text-zinc-950 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Explore APIs</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Total Requests</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-white">
                {stats.total_requests.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                {stats.requests_today} requests today
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Success Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
                {successRate}%
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                {stats.success_requests} successful (2xx)
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Failed Requests</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-rose-400">
                {stats.error_requests.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                Client (4xx) & Server (5xx)
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Avg Latency</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
                {stats.avg_response_time_ms} ms
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                Across all your queries
              </div>
            </div>
          </div>

          {/* Usage by API Table */}
          <div className="rounded-xl border border-zinc-800 bg-[#0e1017] overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/40">
              <h2 className="text-sm font-semibold text-white">Usage by Endpoint</h2>
              <p className="text-xs text-zinc-400">Request breakdown grouped by registered endpoint.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/20 text-zinc-400">
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Endpoint</th>
                    <th className="py-3 px-4">Total Calls</th>
                    <th className="py-3 px-4">Average Latency</th>
                    <th className="py-3 px-4 text-right">Traffic Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {stats.usage_by_api.map((item: any, idx: number) => {
                    const share = stats.total_requests > 0 ? Math.round((item.calls / stats.total_requests) * 100) : 0;
                    return (
                      <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="py-3 px-4">
                          <MethodBadge method={item.method} />
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-200">
                          {item.endpoint}
                        </td>
                        <td className="py-3 px-4 text-zinc-300 font-bold">
                          {item.calls.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {item.avg_latency ? `${item.avg_latency} ms` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-400">
                          <div className="inline-flex items-center gap-2">
                            <span>{share}%</span>
                            <div className="w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-400 h-full rounded-full"
                                style={{ width: `${share}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
