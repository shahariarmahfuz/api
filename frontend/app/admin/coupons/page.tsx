'use client';

import React, { useEffect, useState } from 'react';
import {
  Tag,
  Plus,
  Edit,
  Power,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Percent,
  DollarSign,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(50);
  const [applicablePlanId, setApplicablePlanId] = useState('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');

  useEffect(() => {
    fetchCoupons();
    fetchPlans();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminCoupons();
      setCoupons(res.data || []);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.getActivePlans();
      setPlans(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDescription('');
    setDiscountType('PERCENTAGE');
    setDiscountValue(50);
    setApplicablePlanId('');
    setMaxUses('');
    setValidUntil('');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description || '');
    setDiscountType(c.discount_type);
    setDiscountValue(c.discount_value);
    setApplicablePlanId(c.applicable_plan_id || '');
    setMaxUses(c.max_uses ? c.max_uses.toString() : '');
    setValidUntil(c.valid_until ? c.valid_until.split('T')[0] : '');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleToggleStatus = async (coupon: any) => {
    setActionLoading(true);
    setErrorMsg(null);
    const newStatus = !coupon.is_active;
    try {
      await api.toggleAdminCouponStatus(coupon.id, newStatus);
      setSuccessMsg(`Coupon ${coupon.code} status set to ${newStatus ? 'ACTIVE' : 'INACTIVE'}.`);
      await fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle coupon status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg(null);

    const payload: any = {
      code: code.trim().toUpperCase(),
      description: description.trim() || null,
      discount_type: discountType,
      discount_value: Number(discountValue),
      applicable_plan_id: applicablePlanId ? applicablePlanId : null,
      max_uses: maxUses ? Number(maxUses) : null,
      valid_until: validUntil ? new Date(validUntil).toISOString() : null,
    };

    try {
      if (editingCoupon) {
        await api.updateAdminCoupon(editingCoupon.id, payload);
        setSuccessMsg(`Coupon '${code}' updated successfully.`);
      } else {
        payload.is_active = true;
        await api.createAdminCoupon(payload);
        setSuccessMsg(`Coupon '${code}' created successfully.`);
      }
      setModalOpen(false);
      await fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Admin Control
            </span>
            <span className="text-xs text-zinc-500">•</span>
            <span className="text-xs text-zinc-400 font-mono">Promotional &amp; Discount Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Promotional Coupons
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Create percentage or fixed discount coupon codes, restrict them to specific plans, and set usage limits or expiration dates.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
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

      {/* Coupons Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#050505] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#080808] text-zinc-400">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Applicable Plan</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Usage Count</th>
                <th className="py-3 px-4">Expiration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Loading coupons from database...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No promotional coupons registered yet.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-[#080808] text-amber-400 font-bold border border-white/[0.1]">
                          {c.code}
                        </span>
                      </div>
                      {c.description && (
                        <span className="text-[10px] text-zinc-500 font-sans block mt-1">
                          {c.description}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {c.applicable_plan_name || 'All Eligible Plans'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-950/60 text-indigo-400 border border-indigo-500/30">
                        {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `$${c.discount_value} OFF`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {c.times_used} / {c.max_uses ? c.max_uses : '∞'}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {c.valid_until ? new Date(c.valid_until).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.is_active
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#080808] text-zinc-500 border border-white/[0.08]'
                        }`}
                      >
                        {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg border border-white/[0.08] hover:border-zinc-700 bg-[#080808] text-zinc-300 hover:text-white"
                          title="Edit Coupon"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`p-1.5 rounded-lg border text-xs ${
                            c.is_active
                              ? 'border-rose-900/50 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40'
                              : 'border-emerald-900/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40'
                          }`}
                          title={c.is_active ? 'Deactivate' : 'Activate'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#050505] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Set code, discount type, value, and applicable plan.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-300 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LAUNCH50, WELCOME100"
                  className="w-full px-3 py-2 rounded-xl bg-[#080808] border border-white/[0.08] text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Special promotion for new developers"
                  className="w-full px-3 py-2 rounded-xl bg-[#080808] border border-white/[0.08] text-white font-sans focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#080808] border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#080808] border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Applicable Plan</label>
                <select
                  value={applicablePlanId}
                  onChange={(e) => setApplicablePlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080808] border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Eligible Plans (Universal)</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.price} / {p.billing_interval})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Unlimited if blank"
                    className="w-full px-3 py-2 rounded-xl bg-[#080808] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Valid Until (Expiry)</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#080808] border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] bg-[#080808] text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-colors"
                >
                  {actionLoading ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
