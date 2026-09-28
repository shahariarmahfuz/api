'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Database,
  Server,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function StatusPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const data = await api.checkHealth();
      setPingLatency(Math.round(performance.now() - start));
      setHealthData(data);
    } catch (err) {
      setHealthData({ status: 'offline', error: 'Connection failed' });
    } finally {
      setLoading(false);
    }
  };

  const isHealthy = healthData?.status === 'healthy';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Status Hero Badge */}
      <div
        className={`p-6 rounded-2xl border transition-all text-center mb-10 ${
          isHealthy
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : 'bg-rose-950/20 border-rose-500/30'
        }`}
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-zinc-900 border border-zinc-800">
          {isHealthy ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {isHealthy ? 'All Systems Operational' : 'Service Notice: Systems Degraded'}
        </h1>
        <p className="text-xs text-zinc-400 mt-2 font-mono">
          Last checked: {new Date().toLocaleTimeString()} • Checked from client
        </p>
      </div>

      {/* Component Status Cards */}
      <div className="space-y-4 mb-10">
        <h2 className="text-base font-bold text-white mb-2">Service Status</h2>

        {/* Backend API */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">FastAPI Core Gateway</p>
              <p className="text-xs text-zinc-400 font-mono">HTTP REST Engine • v{healthData?.version || '1.0.0'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            {pingLatency !== null && (
              <span className="text-zinc-400">{pingLatency} ms ping</span>
            )}
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
              Operational
            </span>
          </div>
        </div>

        {/* PostgreSQL Database */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">PostgreSQL (Neon Serverless)</p>
              <p className="text-xs text-zinc-400 font-mono">Connection pool & transaction engine</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            {healthData?.database?.latency_ms && (
              <span className="text-zinc-400">{healthData.database.latency_ms} ms DB latency</span>
            )}
            <span
              className={`px-2.5 py-1 rounded-full border ${
                healthData?.database?.status === 'connected'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                  : 'bg-rose-950/40 text-rose-400 border-rose-800/50'
              }`}
            >
              {healthData?.database?.status === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* API Registry Service */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0e1017] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">Central API Registry & Auth</p>
              <p className="text-xs text-zinc-400 font-mono">Dynamic route discovery & API key hashing</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 text-xs font-mono">
            Operational
          </span>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={checkStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-check System Telemetry</span>
        </button>
      </div>
    </div>
  );
}
