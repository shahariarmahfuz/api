'use client';

import React, { useEffect, useState } from 'react';
import {
  ListOrdered,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Key,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MethodBadge } from '@/components/Badge';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [endpointFilter, setEndpointFilter] = useState('');
  const [statusCodeFilter, setStatusCodeFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadRequests();
  }, [endpointFilter, statusCodeFilter, methodFilter, page]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminRequests({
        endpoint: endpointFilter || undefined,
        status_code: statusCodeFilter !== 'all' ? parseInt(statusCodeFilter) : undefined,
        method: methodFilter !== 'all' ? methodFilter : undefined,
        page,
      });
      setRequests(res.data);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Platform Request Monitoring</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Real-time audit log of all platform invocations, caller identities, and latency telemetry.
          </p>
        </div>
        <button
          onClick={loadRequests}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-[#080808] text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl border border-white/[0.08] bg-[#050505]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={endpointFilter}
            onChange={(e) => {
              setEndpointFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by endpoint path..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#080808] border border-white/[0.08] rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
          />
        </div>

        {/* Status Code Filter */}
        <select
          value={statusCodeFilter}
          onChange={(e) => {
            setStatusCodeFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs font-mono rounded-xl bg-[#080808] border border-white/[0.08] text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
        >
          <option value="all">All Status Codes</option>
          <option value="200">200 OK</option>
          <option value="400">400 Bad Request</option>
          <option value="401">401 Unauthorized</option>
          <option value="403">403 Forbidden</option>
          <option value="404">404 Not Found</option>
          <option value="500">500 Server Error</option>
        </select>

        {/* Method Filter */}
        <select
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs font-mono rounded-xl bg-[#080808] border border-white/[0.08] text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
        >
          <option value="all">All Methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500">
          Loading platform audit records...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-2xl bg-[#050505]/40">
          <ListOrdered className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">No Request Logs</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            No incoming API traffic matches your search filters.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#050505] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#080808] text-zinc-400">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Endpoint</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Caller User</th>
                  <th className="py-3 px-4">Key Prefix</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-zinc-500 text-[11px]">
                      {r.request_id?.slice(0, 14)}...
                    </td>
                    <td className="py-3 px-4">
                      <MethodBadge method={r.method} />
                    </td>
                    <td className="py-3 px-4 text-zinc-200 font-semibold">{r.endpoint}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status_code < 300
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                            : r.status_code < 500
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                        }`}
                      >
                        {r.status_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{r.response_time_ms} ms</td>
                    <td className="py-3 px-4">
                      {r.user_name ? (
                        <div>
                          <div className="text-zinc-200 font-sans">{r.user_name}</div>
                          <div className="text-zinc-500 text-[10px]">{r.user_email}</div>
                        </div>
                      ) : (
                        <span className="text-zinc-600">Anonymous / Public</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {r.api_key_prefix ? (
                        <span className="text-emerald-400">{r.api_key_prefix}•••</span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-500">
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>
                Page {page} of {totalPages} ({totalCount} total events)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded-lg bg-[#080808] border border-white/[0.08] text-zinc-300 hover:text-white disabled:opacity-40 transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg bg-[#080808] border border-white/[0.08] text-zinc-300 hover:text-white disabled:opacity-40 transition-colors"
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
