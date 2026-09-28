'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Power,
  ExternalLink,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Code2,
  Lock,
  Globe,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ApiRegistryItem } from '@/types';
import { MethodBadge, StatusBadge, CategoryBadge } from '@/components/Badge';

export default function DashboardApisPage() {
  const [apis, setApis] = useState<ApiRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inspectModalItem, setInspectModalItem] = useState<ApiRegistryItem | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  useEffect(() => {
    loadApis();
  }, []);

  const loadApis = async () => {
    setLoading(true);
    try {
      const res = await api.getApis({ page_size: 100 });
      setApis(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (slug: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    setToggleLoading(slug);
    try {
      await api.toggleApiStatus(slug, newStatus);
      setApis((prev) =>
        prev.map((item) => (item.slug === slug ? { ...item, status: newStatus as any } : item))
      );
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setToggleLoading(slug);
      setTimeout(() => setToggleLoading(null), 300);
    }
  };

  const filtered = apis.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase()) ||
      a.endpoint.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">API Registry</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Monitor, enable, disable, and inspect all endpoints registered in PostgreSQL.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter APIs..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-zinc-500">
          Loading registered APIs...
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-[#0e1017] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400">
                  <th className="py-3 px-4">API Name</th>
                  <th className="py-3 px-4">Method & Endpoint</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Auth</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-zinc-200">
                      {item.name}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MethodBadge method={item.method} />
                        <span className="text-zinc-300">{item.endpoint}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {item.authentication_required ? (
                        <span className="inline-flex items-center gap-1 text-zinc-400">
                          <Lock className="w-3 h-3 text-zinc-400" />
                          <span>API Key</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <Globe className="w-3 h-3" />
                          <span>Public</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setInspectModalItem(item)}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                          title="View metadata JSON"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(item.slug, item.status)}
                          disabled={toggleLoading === item.slug}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                            item.status === 'active'
                              ? 'bg-zinc-800 text-zinc-300 hover:bg-rose-950/60 hover:text-rose-400'
                              : 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/80'
                          }`}
                        >
                          {item.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <Link
                          href={`/apis/${item.slug}`}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                          title="Open public page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Metadata Inspector Modal */}
      {inspectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-[#0e1017] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Metadata: {inspectModalItem.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectModalItem(null)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto font-mono text-xs text-zinc-300 bg-[#07080d]">
              <pre>{JSON.stringify(inspectModalItem, null, 2)}</pre>
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setInspectModalItem(null)}
                className="px-4 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
