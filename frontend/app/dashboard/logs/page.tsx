'use client';

import React, { useEffect, useState } from 'react';
import {
  ListOrdered,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import { RequestLogItem } from '@/types';
import { MethodBadge } from '@/components/Badge';

export default function DashboardLogsPage() {
  const [logs, setLogs] = useState<RequestLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [endpointFilter, setEndpointFilter] = useState('');
  const [statusCodeFilter, setStatusCodeFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, [endpointFilter, statusCodeFilter, methodFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getMyLogs({
        endpoint: endpointFilter || undefined,
        status_code: statusCodeFilter !== 'all' ? parseInt(statusCodeFilter) : undefined,
        method: methodFilter !== 'all' ? methodFilter : undefined,
      });
      setLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">My Request Logs</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Real-time audit log of all API requests executed with your account or API keys.
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#080808] text-xs font-mono text-zinc-300 hover:text-white hover:bg-[#121212] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-white/[0.08] bg-[#050505]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={endpointFilter}
            onChange={(e) => setEndpointFilter(e.target.value)}
            placeholder="Filter by endpoint path..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#080808] border border-white/[0.08] rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>

        {/* Status Code Filter */}
        <select
          value={statusCodeFilter}
          onChange={(e) => setStatusCodeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#080808] border border-white/[0.08] text-zinc-300 focus:outline-none focus:border-zinc-700"
        >
          <option value="all">All Status Codes</option>
          <option value="200">200 OK</option>
          <option value="400">400 Bad Request</option>
          <option value="401">401 Unauthorized</option>
          <option value="404">404 Not Found</option>
          <option value="500">500 Server Error</option>
        </select>

        {/* Method Filter */}
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#080808] border border-white/[0.08] text-zinc-300 focus:outline-none focus:border-zinc-700"
        >
          <option value="all">All Methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500">
          Loading audit logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-xl bg-[#050505]/40">
          <ListOrdered className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">No Request Logs</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {endpointFilter || statusCodeFilter !== 'all' || methodFilter !== 'all'
              ? 'No requests match your current filters.'
              : 'Your API calls will appear here in real-time.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.08] bg-[#050505] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#080808] text-zinc-400">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Endpoint</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Client IP</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                      {log.request_id.slice(0, 16)}...
                    </td>
                    <td className="py-3 px-4">
                      <MethodBadge method={log.method} />
                    </td>
                    <td className="py-3 px-4 text-zinc-200 font-semibold">{log.endpoint}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          log.status_code < 300
                            ? 'bg-emerald-950/60 text-emerald-400'
                            : log.status_code < 500
                            ? 'bg-amber-950/60 text-amber-400'
                            : 'bg-rose-950/60 text-rose-400'
                        }`}
                      >
                        {log.status_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{log.response_time_ms} ms</td>
                    <td className="py-3 px-4 text-zinc-400">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-right text-zinc-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
