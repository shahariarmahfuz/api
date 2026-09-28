'use client';

import React, { useState } from 'react';
import { Play, Loader2, Key, CheckCircle, AlertTriangle } from 'lucide-react';
import { MethodBadge } from './Badge';
import { api } from '@/lib/api';

interface PlaygroundProps {
  slug: string;
  method: string;
  endpoint: string;
  authRequired: boolean;
  defaultPayload?: Record<string, any>;
}

export function Playground({
  slug,
  method,
  endpoint,
  authRequired,
  defaultPayload = {},
}: PlaygroundProps) {
  const [apiKey, setApiKey] = useState('orv_live_demo_platform_key_2026_modular');
  const [payloadStr, setPayloadStr] = useState(
    JSON.stringify(defaultPayload, null, 2)
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const start = performance.now();

    try {
      let parsedPayload = {};
      if (payloadStr.trim()) {
        try {
          parsedPayload = JSON.parse(payloadStr);
        } catch (e) {
          throw new Error('Invalid JSON payload syntax.');
        }
      }

      const res = await api.executeTest(
        slug,
        parsedPayload,
        authRequired ? apiKey : undefined
      );
      setLatency(Math.round(performance.now() - start));
      setResult(res);
    } catch (err: any) {
      setLatency(Math.round(performance.now() - start));
      setError(err.message || 'Execution error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0e1017] overflow-hidden my-6">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MethodBadge method={method} size="md" />
          <span className="font-mono text-sm text-zinc-200 font-semibold">{endpoint}</span>
        </div>
        <button
          onClick={handleExecute}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Executing...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Send Request</span>
            </>
          )}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* API Key input if required */}
        {authRequired && (
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              <span>API Key (Header: X-API-Key)</span>
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="orv_live_..."
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
          </div>
        )}

        {/* Request Payload */}
        {method.toUpperCase() !== 'GET' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-zinc-400">Request Body (JSON)</label>
              <button
                onClick={() => {
                  try {
                    setPayloadStr(JSON.stringify(JSON.parse(payloadStr), null, 2));
                  } catch (e) {}
                }}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono"
              >
                Format JSON
              </button>
            </div>
            <textarea
              rows={4}
              value={payloadStr}
              onChange={(e) => setPayloadStr(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600 resize-y"
            />
          </div>
        )}

        {/* Result Area */}
        {(result || error) && (
          <div className="pt-3 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {result ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium font-mono">
                    <CheckCircle className="w-3.5 h-3.5" />
                    200 OK
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium font-mono">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Request Error
                  </span>
                )}
              </div>
              {latency !== null && (
                <span className="text-[11px] font-mono text-zinc-500">
                  Latency: {latency} ms
                </span>
              )}
            </div>

            <div className="p-3 rounded-lg bg-[#07080d] border border-zinc-800/80 font-mono text-xs overflow-x-auto text-zinc-200">
              <pre>{JSON.stringify(result || { error }, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
