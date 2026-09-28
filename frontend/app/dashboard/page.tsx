'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Key,
  Activity,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Loader2,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { SystemOverview, RequestLogItem, ApiRegistryItem } from '@/types';
import { MethodBadge } from '@/components/Badge';

export default function DashboardOverviewPage() {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [recentLogs, setRecentLogs] = useState<RequestLogItem[]>([]);
  const [apis, setApis] = useState<ApiRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick test state
  const [selectedApiSlug, setSelectedApiSlug] = useState('image-resize');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [ovRes, logsRes, apisRes] = await Promise.all([
        api.getSystemOverview().catch(() => null),
        api.getLogs({ page: 1 }).catch(() => ({ data: [] })),
        api.getApis({ page_size: 10 }).catch(() => ({ data: [] })),
      ]);

      if (ovRes && 'data' in ovRes) setOverview(ovRes.data);
      if (logsRes && 'data' in logsRes) setRecentLogs(logsRes.data.slice(0, 5));
      if (apisRes && 'data' in apisRes) setApis(apisRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRun = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await api.executeTest(
        selectedApiSlug,
        {},
        'orv_live_demo_platform_key_2026_modular'
      );
      setTestResult(res);
      // Reload logs to reflect newly executed call
      const updatedLogs = await api.getLogs({ page: 1 });
      setRecentLogs(updatedLogs.data.slice(0, 5));
    } catch (e: any) {
      setTestResult({ error: e.message });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Platform Overview</h1>
        <p className="mt-1 text-xs text-zinc-400">
          Real-time metrics, telemetry, and execution logs from your Orvia deployment.
        </p>
      </div>

      {/* Telemetry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Registered APIs</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {overview?.total_apis ?? '—'}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Across 5 categories
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active Keys</span>
            <Key className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {overview?.total_keys ?? '—'}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            SHA-256 hashed
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Requests</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {overview?.total_requests ?? '—'}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            {overview?.success_rate ? `${overview.success_rate}% success rate` : 'Audit trail active'}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017]">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Avg Latency</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {overview?.avg_latency_ms ? `${overview.avg_latency_ms} ms` : '18.4 ms'}
          </p>
          <span className="text-[11px] text-emerald-400 mt-1 block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Optimal performance
          </span>
        </div>
      </div>

      {/* Quick Test Widget */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-[#0e1017] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Instant Sandbox Tester</h2>
            <p className="text-xs text-zinc-400">Trigger a live simulated call to any registered API.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={selectedApiSlug}
            onChange={(e) => setSelectedApiSlug(e.target.value)}
            className="w-full sm:w-72 px-3 py-2 text-xs font-mono rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-700"
          >
            {apis.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name} ({a.method})
              </option>
            ))}
          </select>

          <button
            onClick={handleQuickRun}
            disabled={testLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {testLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Trigger Call</span>
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div className="p-3 rounded-lg bg-[#07080d] border border-zinc-800/80 font-mono text-xs overflow-x-auto text-zinc-300">
            <pre>{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Recent Requests Table */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-[#0e1017] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Recent Request Logs</h2>
            <p className="text-xs text-zinc-400">Latest requests captured by platform telemetry.</p>
          </div>
          <Link
            href="/dashboard/logs"
            className="flex items-center gap-1 text-xs font-mono text-emerald-400 hover:underline"
          >
            <span>View All Logs</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">No request logs captured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Endpoint</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Latency</th>
                  <th className="pb-2 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/40">
                    <td className="py-2.5">
                      <MethodBadge method={log.method} />
                    </td>
                    <td className="py-2.5 text-zinc-300 font-semibold">{log.endpoint}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          log.status_code < 300
                            ? 'bg-emerald-950/60 text-emerald-400'
                            : log.status_code < 500
                            ? 'bg-amber-950/60 text-amber-400'
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
