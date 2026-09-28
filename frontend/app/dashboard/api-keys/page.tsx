'use client';

import React, { useEffect, useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  X,
  ShieldCheck,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ApiKeyItem, ApiKeyCreated } from '@/types';
import { StatusBadge } from '@/components/Badge';

export default function DashboardApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Key Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [rateLimit, setRateLimit] = useState('60/min');
  const [creating, setCreating] = useState(false);
  const [newKeyData, setNewKeyData] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await api.getMyApiKeys();
      setKeys(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    setCreating(true);
    try {
      const res = await api.createMyApiKey(keyName.trim(), rateLimit);
      setNewKeyData(res.data);
      setKeyName('');
      loadKeys();
    } catch (err: any) {
      alert(`Error creating key: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action is permanent and immediate.')) {
      return;
    }
    try {
      await api.revokeMyApiKey(keyId);
      loadKeys();
    } catch (err: any) {
      alert(`Error revoking key: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">My API Keys</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Keys belong exclusively to your account. Plaintext secrets are hashed with SHA-256 and never retained.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadKeys}
            disabled={loading}
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Refresh API Keys"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setNewKeyData(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-white transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create API Key</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500">
          Loading your API keys...
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-[#0e1017]/40">
          <Key className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">No API Keys Generated</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto mb-5">
            Generate an API key to securely authenticate programmatic requests against Orvia endpoints.
          </p>
          <button
            onClick={() => {
              setNewKeyData(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate First Key</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-[#0e1017] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400">
                  <th className="py-3 px-4">Key Name</th>
                  <th className="py-3 px-4">Masked Key</th>
                  <th className="py-3 px-4">Rate Limit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Last Used</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-zinc-200">
                      {k.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-300">
                      <span className="text-emerald-400">{k.key_prefix}</span>
                      <span className="text-zinc-600 tracking-wider">••••••••••••••••••••••••</span>
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
                          onClick={() => handleRevokeKey(k.id)}
                          className="p-1.5 rounded hover:bg-rose-950/50 text-zinc-500 hover:text-rose-400 transition-colors inline-flex items-center gap-1"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-sans">Revoke</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-600">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#0e1017] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Create New API Key</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {!newKeyData ? (
                <form onSubmit={handleCreateKey} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Key Name / Description
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Production Backend, Image Processing Service"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Rate Limit Policy
                    </label>
                    <select
                      value={rateLimit}
                      onChange={(e) => setRateLimit(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                    >
                      <option value="60/min">60 requests / minute (Standard Tier)</option>
                      <option value="120/min">120 requests / minute (Pro Tier)</option>
                      <option value="300/min">300 requests / minute (Enterprise Tier)</option>
                    </select>
                  </div>

                  <p className="text-[11px] text-zinc-500">
                    A SHA-256 cryptographic hash of this key will be recorded in PostgreSQL. The full plaintext key is only returned once.
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !keyName.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 disabled:opacity-50"
                    >
                      {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Generate Key</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      <strong>Important:</strong> Copy and store this secret key now. For your security, this key will never be displayed again.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                      Your Secret API Key
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={newKeyData.secret_key}
                        className="flex-1 px-3 py-2 text-xs font-mono rounded-lg bg-zinc-900 border border-emerald-500/60 text-emerald-400 focus:outline-none select-all"
                      />
                      <button
                        onClick={() => copyToClipboard(newKeyData.secret_key)}
                        className="px-3 py-2 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-1 shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white"
                    >
                      I have saved my key
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
