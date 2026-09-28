'use client';

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  Edit,
  Power,
  Users,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [availableApis, setAvailableApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(10);
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [durationDays, setDurationDays] = useState(30);
  const [monthlyLimit, setMonthlyLimit] = useState(100000);
  const [rateLimit, setRateLimit] = useState(60);
  const [maxConcurrent, setMaxConcurrent] = useState(10);
  const [isAllApis, setIsAllApis] = useState(false);
  const [selectedApiIds, setSelectedApiIds] = useState<string[]>([]);
  const [features, setFeatures] = useState('');

  useEffect(() => {
    fetchPlans();
    fetchApis();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminPlans();
      setPlans(res.data || []);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchApis = async () => {
    try {
      const res = await api.getApis({ page_size: 100 });
      setAvailableApis(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    }
  };


  const openCreateModal = () => {
    setEditingPlan(null);
    setName('');
    setSlug('');
    setDescription('');
    setPrice(10);
    setBillingInterval('monthly');
    setDurationDays(30);
    setMonthlyLimit(100000);
    setRateLimit(60);
    setMaxConcurrent(10);
    setIsAllApis(false);
    setSelectedApiIds([]);
    setFeatures('All essential endpoints\nPriority routing\nDedicated support');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingPlan(p);
    setName(p.name);
    setSlug(p.slug);
    setDescription(p.description);
    setPrice(p.price);
    setBillingInterval(p.billing_interval);
    setDurationDays(p.duration_days);
    setMonthlyLimit(p.monthly_request_limit);
    setRateLimit(p.rate_limit_per_minute);
    setMaxConcurrent(p.max_concurrent_requests);
    setIsAllApis(p.is_all_apis);
    setSelectedApiIds(p.allowed_apis ? p.allowed_apis.map((a: any) => a.id) : []);
    setFeatures(p.features ? p.features.join('\n') : '');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleToggleStatus = async (plan: any) => {
    setActionLoading(true);
    setErrorMsg(null);
    const newStatus = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.toggleAdminPlanStatus(plan.id, newStatus);
      setSuccessMsg(`Plan ${plan.name} status updated to ${newStatus}.`);
      await fetchPlans();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle plan status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg(null);

    const featureList = features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const payload: any = {
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      description,
      price: Number(price),
      billing_interval: billingInterval,
      duration_days: Number(durationDays),
      monthly_request_limit: Number(monthlyLimit),
      rate_limit_per_minute: Number(rateLimit),
      max_concurrent_requests: Number(maxConcurrent),
      is_all_apis: isAllApis,
      api_ids: isAllApis ? [] : selectedApiIds,
      features: featureList,
    };

    try {
      if (editingPlan) {
        await api.updateAdminPlan(editingPlan.id, payload);
        setSuccessMsg(`Plan '${name}' updated successfully.`);
      } else {
        payload.status = 'ACTIVE';
        await api.createAdminPlan(payload);
        setSuccessMsg(`Plan '${name}' created successfully.`);
      }
      setModalOpen(false);
      await fetchPlans();
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleApiSelection = (apiId: string) => {
    setSelectedApiIds((prev) =>
      prev.includes(apiId) ? prev.filter((id) => id !== apiId) : [...prev, apiId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Admin Control
            </span>
            <span className="text-xs text-zinc-500">•</span>
            <span className="text-xs text-zinc-400 font-mono">Plan &amp; Entitlement Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Subscription Plans
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Define pricing, usage limits, rate limiting, and API endpoint entitlements. Plans are stored dynamically in the database.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Plan</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Plans Table */}
      <div className="rounded-2xl border border-zinc-800 bg-[#0e1017] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-mono">
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4">Price / Interval</th>
                <th className="py-3 px-4">Request Limit</th>
                <th className="py-3 px-4">Rate Limit</th>
                <th className="py-3 px-4">API Access</th>
                <th className="py-3 px-4">Subscribers</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    Loading plans from database...
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    No subscription plans configured yet.
                  </td>
                </tr>
              ) : (
                plans.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-900/40">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-white text-sm block font-sans">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 block font-mono">
                          slug: {p.slug}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-zinc-200 font-bold">${p.price}</span>
                      <span className="text-zinc-500 text-[11px]"> / {p.billing_interval}</span>
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {p.monthly_request_limit.toLocaleString()} / mo
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {p.rate_limit_per_minute} req/min
                    </td>
                    <td className="py-3 px-4">
                      {p.is_all_apis ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 font-semibold">
                          All APIs
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-300">
                          {p.allowed_apis?.length || 0} APIs
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{p.active_subscribers_count || 0}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
                          title="Edit Plan"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`p-1.5 rounded-lg border text-xs ${
                            p.status === 'ACTIVE'
                              ? 'border-rose-900/50 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40'
                              : 'border-emerald-900/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40'
                          }`}
                          title={p.status === 'ACTIVE' ? 'Deactivate (Soft)' : 'Activate'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#0e1017] p-6 shadow-2xl my-8 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Subscription Plan'}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure limits, pricing, and API access permissions.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingPlan) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
                      }
                    }}
                    placeholder="e.g. Starter, Pro, Enterprise"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Slug (Identifier) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPlan}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. starter"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of what is included in this plan..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1">Price ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Billing Interval</label>
                  <select
                    value={billingInterval}
                    onChange={(e) => {
                      setBillingInterval(e.target.value);
                      setDurationDays(e.target.value === 'yearly' ? 365 : 30);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1">Monthly Request Limit *</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Rate Limit (Req/Min) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rateLimit}
                    onChange={(e) => setRateLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Max Concurrency</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={maxConcurrent}
                    onChange={(e) => setMaxConcurrent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* API Entitlement selection */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">API Endpoint Entitlements</span>
                    <span className="text-[11px] text-zinc-400">
                      Determine which APIs users with this plan can call.
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllApis}
                      onChange={(e) => setIsAllApis(e.target.checked)}
                      className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-zinc-200 font-bold">Grant Access to All APIs</span>
                  </label>
                </div>

                {!isAllApis && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pt-2 border-t border-zinc-800">
                    {availableApis.map((apiItem) => {
                      const isSelected = selectedApiIds.includes(apiItem.id);
                      return (
                        <div
                          key={apiItem.id}
                          onClick={() => toggleApiSelection(apiItem.id)}
                          className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold truncate font-sans">{apiItem.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">{apiItem.endpoint}</p>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Features List */}
              <div>
                <label className="block text-zinc-300 mb-1">
                  Features Checklist (one per line)
                </label>
                <textarea
                  rows={3}
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-sans focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
                >
                  {actionLoading ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
