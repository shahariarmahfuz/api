'use client';

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Sparkles,
  ShieldCheck,
  Tag,
  ArrowRight,
  AlertCircle,
  Clock,
  Layers,
  Check,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function UserPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Activation Modal State
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [activationMethod, setActivationMethod] = useState<'coupon' | 'payment'>('coupon');
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<any | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [activating, setActivating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [paymentPendingIntent, setPaymentPendingIntent] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.all([
        api.getActivePlans(),
        api.getMyActiveSubscription(),
      ]);
      setPlans(plansRes.data || []);
      setActiveSub(subRes.data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openActivationModal = (plan: any) => {
    setSelectedPlan(plan);
    setCouponCode('');
    setCouponValidation(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPaymentPendingIntent(null);
    setActivationMethod('coupon');
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;
    setValidatingCoupon(true);
    setErrorMsg(null);
    setCouponValidation(null);
    try {
      const res = await api.validateCoupon(couponCode.trim(), selectedPlan.id);
      setCouponValidation(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Coupon validation failed');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleActivateWithCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;
    setActivating(true);
    setErrorMsg(null);
    try {
      await api.activateCoupon(couponCode.trim(), selectedPlan.id);
      setSuccessMsg(`Plan ${selectedPlan.name} successfully activated!`);
      await fetchData();
      setTimeout(() => {
        setSelectedPlan(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Activation failed');
    } finally {
      setActivating(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!selectedPlan) return;
    setActivating(true);
    setErrorMsg(null);
    try {
      const res = await api.initiatePayment(selectedPlan.id, selectedPlan.billing_interval || 'monthly');
      setPaymentPendingIntent(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment initiation failed');
    } finally {
      setActivating(false);
    }
  };

  const currentPlanId = activeSub?.has_active_plan ? activeSub?.subscription?.plan_id : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Modular Entitlements
          </span>
          <span className="text-xs text-zinc-500">•</span>
          <span className="text-xs text-zinc-400 font-mono">Real database-backed subscription limits</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          API Subscription Plans
        </h1>
        <p className="mt-1 text-xs text-zinc-400 max-w-2xl">
          Choose a plan that fits your production workload. Plans configure monthly request quotas, per-minute rate limits, and endpoint access entitlements.
        </p>
      </div>

      {/* Current Active Plan summary banner if active */}
      {activeSub?.has_active_plan && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                Active Subscription: <span className="text-emerald-400 font-bold">{activeSub.subscription?.plan?.name || 'Pro'}</span> (${activeSub.subscription?.amount_paid} / {activeSub.subscription?.billing_interval})
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                {activeSub.usage?.requests_used?.toLocaleString() || 0} / {activeSub.usage?.requests_limit?.toLocaleString() || 0} requests used • {activeSub.usage?.days_remaining || 0} days remaining
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            STATUS: ACTIVE
          </span>
        </div>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-2xl border border-zinc-800 bg-[#0e1017] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isPopular = plan.slug === 'pro';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 ${
                  isCurrent
                    ? 'border-2 border-emerald-500/60 bg-gradient-to-b from-[#0f1516] to-[#0c0e14] shadow-lg shadow-emerald-950/30'
                    : isPopular
                    ? 'border-2 border-indigo-500/40 bg-gradient-to-b from-[#12111d] to-[#0e1017] shadow-xl shadow-indigo-950/20'
                    : 'border border-zinc-800 bg-[#0e1017] hover:border-zinc-700'
                }`}
              >
                {/* Popular / Active Badge */}
                {isCurrent ? (
                  <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                    Current Active Plan
                  </div>
                ) : isPopular ? (
                  <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                ) : null}

                <div>
                  {/* Plan Name & Desc */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{plan.name}</h3>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      {plan.billing_interval}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 min-h-[36px] leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="my-5 pb-5 border-b border-zinc-800 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white font-mono tracking-tight">
                      ${plan.price}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      / {plan.billing_interval || 'month'}
                    </span>
                  </div>

                  {/* Limits Telemetry */}
                  <div className="space-y-2.5 mb-6 text-xs font-mono">
                    <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                      <span className="text-zinc-400">Monthly Quota</span>
                      <span className="font-bold text-zinc-200">
                        {plan.monthly_request_limit.toLocaleString()} reqs
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                      <span className="text-zinc-400">Rate Limit</span>
                      <span className="font-bold text-zinc-200">
                        {plan.rate_limit_per_minute} req/min
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                      <span className="text-zinc-400">Endpoint Access</span>
                      <span className="font-bold text-indigo-400">
                        {plan.is_all_apis ? 'All Platform APIs' : `${plan.allowed_apis?.length || 0} APIs`}
                      </span>
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="space-y-2 mb-6">
                    <span className="text-[11px] uppercase tracking-wider font-mono text-zinc-500 font-semibold block mb-2">
                      Included Capabilities
                    </span>
                    {plan.features?.map((f: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activation Button */}
                <div className="pt-4 border-t border-zinc-800/80">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-400 font-semibold text-xs cursor-default flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Currently Active</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openActivationModal(plan)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        isPopular
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40'
                          : 'bg-zinc-100 hover:bg-white text-zinc-950'
                      }`}
                    >
                      <span>Activate Plan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PLAN ACTIVATION MODAL */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0e1017] p-6 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold block mb-1">
                  Plan Activation
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Activate {selectedPlan.name} Plan
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  ${selectedPlan.price} / {selectedPlan.billing_interval} • {selectedPlan.monthly_request_limit.toLocaleString()} monthly requests
                </p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error or Success notification */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Activation Method Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setActivationMethod('coupon');
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activationMethod === 'coupon'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Activate with Coupon</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivationMethod('payment');
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activationMethod === 'payment'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Payment (Architecture Ready)</span>
              </button>
            </div>

            {/* TAB 1: ACTIVATE WITH COUPON */}
            {activationMethod === 'coupon' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                    Promotional Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. ORVIA100 or PRO50"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs uppercase placeholder:normal-case placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleValidateCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shrink-0"
                    >
                      {validatingCoupon ? 'Checking...' : 'Apply Coupon'}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Try promotional code <strong className="text-amber-400">ORVIA100</strong> for 100% launch activation or <strong className="text-amber-400">PRO50</strong> for Pro.
                  </p>
                </div>

                {/* Validation summary card */}
                {couponValidation && (
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Original Plan Price</span>
                      <span>${couponValidation.original_price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Discount ({couponValidation.discount_type === 'PERCENTAGE' ? `${couponValidation.discount_value}%` : `$${couponValidation.discount_value}`})</span>
                      <span>-${couponValidation.discount_amount.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between font-bold text-white text-sm">
                      <span>Final Payable</span>
                      <span className="text-emerald-400 font-mono">${couponValidation.final_price.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleActivateWithCoupon}
                  disabled={activating || !couponCode.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{activating ? 'Activating Plan...' : 'Activate Subscription Now'}</span>
                </button>
              </div>
            )}

            {/* TAB 2: PAYMENT (ARCHITECTURE READY) */}
            {activationMethod === 'payment' && (
              <div className="space-y-4">
                {/* Architecture readiness badge */}
                <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-xs text-zinc-300 space-y-1">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold font-mono text-[11px]">
                    <CreditCard className="w-4 h-4" />
                    <span>Payment Architecture Ready</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Direct payment gateway integration is currently in sandbox/preparation mode. Clicking below initializes a real payment intent order on the backend with a pending subscription token.
                  </p>
                </div>

                {/* Order Summary */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Plan</span>
                    <span className="text-zinc-200 font-bold">{selectedPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Billing Interval</span>
                    <span className="text-zinc-200 capitalize">{selectedPlan.billing_interval}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Monthly Quota</span>
                    <span className="text-zinc-200">{selectedPlan.monthly_request_limit.toLocaleString()} reqs</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between font-bold text-white text-sm">
                    <span>Order Total</span>
                    <span className="font-mono text-emerald-400">${selectedPlan.price.toFixed(2)} USD</span>
                  </div>
                </div>

                {paymentPendingIntent ? (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-1 font-mono">
                    <p className="text-amber-300 font-bold">Payment Intent Registered:</p>
                    <p className="text-zinc-300">Reference: <code className="text-white bg-zinc-800 px-1 py-0.5 rounded">{paymentPendingIntent.payment_reference}</code></p>
                    <p className="text-zinc-400 text-[11px] mt-1">{paymentPendingIntent.instructions}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleInitiatePayment}
                    disabled={activating}
                    className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>{activating ? 'Registering Order...' : 'Continue to Payment / Initiate Order'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
