'use client';

import React, { useEffect, useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Loader2,
  Shield,
  Key,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ApiRegistryItem } from '@/types';
import { MethodBadge, StatusBadge } from '@/components/Badge';

export default function AdminApisPage() {
  const [apis, setApis] = useState<ApiRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Register Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'utility',
    version: 'v1',
    method: 'POST',
    endpoint: '',
    description: '',
    rate_limit: '60/min',
    authentication_required: true,
  });

  // Details Modal
  const [viewingApi, setViewingApi] = useState<ApiRegistryItem | null>(null);

  useEffect(() => {
    loadApis();
  }, [search, categoryFilter, statusFilter]);

  const loadApis = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminApis({
        search: search || undefined,
        category: categoryFilter,
        status: statusFilter,
      });
      setApis(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (slug: string, newStatus: string) => {
    try {
      await api.toggleAdminApiStatus(slug, newStatus);
      loadApis();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleRegisterApi = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.registerAdminApi(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        slug: '',
        category: 'utility',
        version: 'v1',
        method: 'POST',
        endpoint: '',
        description: '',
        rate_limit: '60/min',
        authentication_required: true,
      });
      loadApis();
    } catch (err: any) {
      alert(`Failed to register API: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">API Registry Administration</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Control platform endpoint availability, deprecation states, and catalog registrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadApis}
            disabled={loading}
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-zinc-950 font-semibold text-xs hover:bg-emerald-400 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Register New API</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-[#0e1017]">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search APIs by name, slug, or endpoint..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-mono rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-zinc-700 capitalize"
        >
          <option value="all">All Categories</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="utility">Utility</option>
          <option value="ai">AI</option>
          <option value="system">System</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-mono rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-zinc-700"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="beta">Beta</option>
          <option value="deprecated">Deprecated</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* APIs Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500">
          Loading platform registry...
        </div>
      ) : apis.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-[#0e1017]/40">
          <Layers className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">No APIs Found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto mb-4">
            No API registrations match your current filter parameters.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register First API</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-[#0e1017] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400">
                  <th className="py-3 px-4">Method & Name</th>
                  <th className="py-3 px-4">Slug / Path</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Rate Limit</th>
                  <th className="py-3 px-4">Auth</th>
                  <th className="py-3 px-4">Status & Control</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {apis.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MethodBadge method={item.method} />
                        <span className="font-sans font-semibold text-zinc-200">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-zinc-300">{item.endpoint}</div>
                      <div className="text-zinc-500 text-[11px]">{item.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 capitalize text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{item.rate_limit}</td>
                    <td className="py-3 px-4">
                      {item.authentication_required ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                          <Key className="w-3 h-3" />
                          <span>Required</span>
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">Public</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.slug, e.target.value)}
                        className={`px-2 py-1 rounded text-[11px] font-mono font-bold focus:outline-none cursor-pointer border ${
                          item.status === 'active'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                            : item.status === 'beta'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                            : item.status === 'deprecated'
                            ? 'bg-orange-950/60 text-orange-300 border-orange-800/60'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="beta">Beta</option>
                        <option value="deprecated">Deprecated</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setViewingApi(item)}
                        className="p-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors text-[11px] font-sans inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect API Modal */}
      {viewingApi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-[#0e1017] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <MethodBadge method={viewingApi.method} />
                <h3 className="text-sm font-bold text-white">{viewingApi.name}</h3>
              </div>
              <button
                onClick={() => setViewingApi(null)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] mb-1">Full Path</span>
                <span className="text-emerald-400 text-sm font-bold">{viewingApi.endpoint}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-zinc-300">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Slug</span>
                  <span>{viewingApi.slug}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Category / Version</span>
                  <span className="capitalize">{viewingApi.category} • {viewingApi.version}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Rate Limit</span>
                  <span>{viewingApi.rate_limit}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Auth Policy</span>
                  <span>{viewingApi.authentication_required ? 'Required (API Key / JWT)' : 'None'}</span>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 block text-[10px] mb-1">Description</span>
                <p className="text-zinc-300 font-sans text-xs bg-zinc-900/30 p-2.5 rounded border border-zinc-800/80">
                  {viewingApi.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewingApi(null)}
                  className="px-4 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-sans"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register New API Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-[#0e1017] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Register API in Catalog</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterApi} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">API Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Image Resize"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setFormData({ ...formData, name, slug: formData.slug || slug });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cloudinary-image-upload"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Method</label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-700 capitalize"
                  >
                    <option value="image">image</option>
                    <option value="video">video</option>
                    <option value="utility">utility</option>
                    <option value="ai">ai</option>
                    <option value="system">system</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Version</label>
                  <input
                    type="text"
                    required
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Endpoint Path</label>
                <input
                  type="text"
                  required
                  placeholder="/api/v1/category/action"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Comprehensive description of functionality and parameters."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-zinc-300 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.authentication_required}
                    onChange={(e) =>
                      setFormData({ ...formData, authentication_required: e.target.checked })
                    }
                    className="rounded bg-zinc-900 border-zinc-800 text-emerald-500 focus:ring-0"
                  />
                  <span>Authentication Required</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 disabled:opacity-50"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register API</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
