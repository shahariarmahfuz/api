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
  AlertCircle,
  CreditCard,
  Gauge,
  Calendar,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { MethodBadge } from '@/components/Badge';

export default function UserDashboardOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [subData, setSubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserOverview();
  }, []);

  const loadUserOverview = async () => {
    try {
      const [statsRes, subRes] = await Promise.allSettled([
        api.getMyUsageStats(),
        api.getMyActiveSubscription(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
      if (subRes.status === 'fulfilled') {
        setSubData(subRes.value.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const hasActivePlan = subData?.has_active_plan;
  const currentSub = subData?.subscription;
  const subUsage = subData?.usage;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Developer Overview
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Welcome back, <strong className="text-zinc-200">{user?.name}</strong>. Here is your personal API platform status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/plans"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 font-semibold text-xs hover:bg-zinc-800 transition-all shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
            <span>{hasActivePlan ? 'Manage Plan' : 'View Plans'}</span>
          </Link>
          <Link
            href="/dashboard/api-keys"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-white transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New API Key</span>
          </Link>
        </div>
      </div>

      {/* PLAN STATUS BANNER */}
      {!loading && (
        <>
          {!hasActivePlan ? (
            /* NO ACTIVE PLAN ALERT BANNER */
            <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-[#13110d] to-[#0e1017] shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-64 bg-amber-500/5 blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white tracking-tight">
                        No Active Plan
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Activation Required
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 max-w-xl leading-relaxed">
                      You need an active plan to use the Orvia API platform. Any API requests made without an active subscription will be rejected with an authentication gate. Activate with coupon code <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono font-bold text-[11px]">ORVIA100</code> to get started immediately.
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/plans"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-950/50 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>View Plans &amp; Activate</span>
                </Link>
              </div>
            </div>
          ) : (
            /* CURRENT PLAN TELEMETRY CARD */
            <div className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/60 via-[#0e1017] to-[#12101e] shadow-lg relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400 tracking-wide uppercase">
                      Current Plan
                    </span>
                    <span className="text-xs text-zinc-400">
                      Billing interval: <span className="capitalize text-zinc-200">{currentSub?.billing_interval || 'Monthly'}</span>
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 mt-2">
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      {currentSub?.plan?.name || currentSub?.plan_snapshot?.name || 'Pro'}
                    </h2>
                    <span className="text-sm font-semibold text-zinc-400 font-mono">
                      ${currentSub?.plan?.price || currentSub?.plan_snapshot?.price || 0} / {currentSub?.billing_interval || 'month'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-zinc-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Rate Limit: <strong className="text-zinc-200">{subUsage?.rate_limit_per_minute || 60} req/min</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Expires: <strong className="text-zinc-200">{currentSub?.end_date ? new Date(currentSub.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</strong> ({subUsage?.days_remaining || 0} days remaining)</span>
                    </div>
                  </div>
                </div>

                {/* Usage meter */}
                <div className="w-full md:w-80 p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-zinc-400 font-mono">Monthly Request Usage</span>
                    <span className="text-zinc-200 font-mono font-bold">
                      {subUsage?.usage_percentage?.toFixed(1) || 0}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, subUsage?.usage_percentage || 0)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mt-2">
                    <span>
                      <strong className="text-zinc-200">{(subUsage?.requests_used || 0).toLocaleString()}</strong> / {(subUsage?.requests_limit || 100000).toLocaleString()} requests
                    </span>
                    <Link href="/dashboard/plans" className="text-indigo-400 hover:underline">
                      Upgrade
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

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
            <span className="text-xs font-mono uppercase tracking-wider">Plan Status</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {hasActivePlan ? currentSub?.plan?.name || 'Active' : 'No Plan'}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            {hasActivePlan ? `${subUsage?.rate_limit_per_minute || 60} req/min limit` : 'Activation required'}
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
              {!hasActivePlan
                ? 'Activate a plan above, generate an API key, and test any endpoint to view real telemetry here.'
                : 'Send a test request from the catalog or terminal to view real telemetry here.'}
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
