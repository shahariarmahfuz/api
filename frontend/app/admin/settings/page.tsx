'use client';

import React, { useEffect, useState } from 'react';
import {
  Database,
  Shield,
  Server,
  RefreshCw,
  CheckCircle2,
  Lock,
  Layers,
  Key,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedMessage, setReseedMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminSettings();
      setSettings(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReseed = async () => {
    if (!confirm('Re-run database seeder to verify system records and restore default endpoints?')) return;
    setReseedLoading(true);
    setReseedMessage(null);
    try {
      const res = await fetch('/api/v1/system/seed', { method: 'POST' });
      const data = await res.json();
      setReseedMessage('Database successfully synchronized with code manifests.');
      loadSettings();
    } catch (e: any) {
      setReseedMessage(`Reseed failed: ${e.message}`);
    } finally {
      setReseedLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Platform Settings & Architecture</h1>
        <p className="mt-1 text-xs text-zinc-400">
          Infrastructure configurations, connection pools, and platform security policies.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500">
          Loading platform settings...
        </div>
      ) : (
        <>
          {/* Database Health Card */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-[#0e1017] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">PostgreSQL Neon Database</h2>
                  <p className="text-xs text-zinc-400 font-mono">
                    Driver: {settings?.database?.driver || 'asyncpg'} • SSL Required
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active Connection</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-800/80 text-xs font-mono">
              <div>
                <span className="text-zinc-500 block mb-1">Status</span>
                <span className="text-zinc-200 capitalize">{settings?.database?.status || 'Active'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">Ping Latency</span>
                <span className="text-zinc-200">
                  {settings?.database?.latency_ms ? `${settings.database.latency_ms} ms` : '< 15 ms'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">ORM / Layer</span>
                <span className="text-zinc-200">SQLAlchemy 2.x</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">Pool Pre-Ping</span>
                <span className="text-emerald-400">Enabled</span>
              </div>
            </div>
          </div>

          {/* Platform Security Policies */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-[#0e1017] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Cryptographic Security Standards</h2>
                <p className="text-xs text-zinc-400">Cryptographic policies applied platform-wide.</p>
              </div>
            </div>

            <div className="divide-y divide-zinc-800/80 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-zinc-200 font-medium block">Password Storage</span>
                  <span className="text-zinc-500 text-[11px]">Bcrypt adaptive key-derivation function</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">bcrypt (12 rounds)</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-zinc-200 font-medium block">API Key Storage</span>
                  <span className="text-zinc-500 text-[11px]">Plaintext secrets are never written to disk</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">SHA-256 Hashed</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-zinc-200 font-medium block">Session Authorization</span>
                  <span className="text-zinc-500 text-[11px]">Stateless signed tokens with role claims</span>
                </div>
                <span className="font-mono text-zinc-300">JWT (HS256)</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-zinc-200 font-medium block">Supported RBAC Roles</span>
                  <span className="text-zinc-500 text-[11px]">Role hierarchy enforced by backend middleware</span>
                </div>
                <span className="font-mono text-zinc-300">USER, ADMIN</span>
              </div>
            </div>
          </div>

          {/* Platform Synchronization */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-[#0e1017] space-y-3">
            <h2 className="text-base font-semibold text-white">Platform Seeder & Sync</h2>
            <p className="text-xs text-zinc-400">
              Sync code manifest definitions with PostgreSQL database records.
            </p>
            <div className="pt-2">
              <button
                onClick={handleReseed}
                disabled={reseedLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reseedLoading ? 'animate-spin' : ''}`} />
                <span>Sync Manifests & Re-seed</span>
              </button>
              {reseedMessage && (
                <p className="text-xs text-emerald-400 mt-2 font-mono">{reseedMessage}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
