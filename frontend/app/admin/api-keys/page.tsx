'use client';

import React, { useEffect, useState } from 'react';
import {
  Key,
  Trash2,
  RefreshCw,
  Search,
  AlertTriangle,
  User,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/Badge';

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadKeys();
  }, [page]);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminApiKeys(page);
      setKeys(res.data);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to revoke key '${keyName}'? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.revokeAdminApiKey(keyId);
      loadKeys();
    } catch (err: any) {
      alert(`Failed to revoke key: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">API Key Administration</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Platform-wide cryptographic key audit. Plaintext secrets are strictly protected with SHA-256 hashes.
          </p>
        </div>
        <button
          onClick={loadKeys}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Keys</span>
        </button>
      </div>

      {/* Keys Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500">
          Auditing active platform API keys...
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-[#0e1017]/40">
          <Key className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">No API Keys Generated</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            No active or revoked API keys exist in the database.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-[#0e1017] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400">
                  <th className="py-3 px-4">Key Name</th>
                  <th className="py-3 px-4">Masked Key Hash</th>
                  <th className="py-3 px-4">Owner Account</th>
                  <th className="py-3 px-4">Rate Limit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Last Used</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-zinc-200">
                      {k.name}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      <span className="text-emerald-400">{k.key_prefix}</span>
                      <span className="text-zinc-600 tracking-wider">••••••••••••••••</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-zinc-200 font-sans">{k.owner_name}</div>
                      <div className="text-zinc-500 text-[11px]">{k.owner_email}</div>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{k.rate_limit}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={k.status} />
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {k.status === 'active' ? (
                        <button
                          onClick={() => handleRevokeKey(k.id, k.name)}
                          className="p-1 px-2 rounded bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition-colors text-[11px] font-sans inline-flex items-center gap-1"
                          title="Revoke key immediately"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      ) : (
                        <span className="text-zinc-600 text-[11px]">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>
                Page {page} of {totalPages} ({totalCount} total keys)
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
    </div>
  );
}
