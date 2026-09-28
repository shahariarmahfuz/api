'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Terminal,
  Database,
  Code2,
  Cpu,
  BarChart3,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ApiRegistryItem, SystemOverview } from '@/types';
import { MethodBadge, StatusBadge, CategoryBadge } from '@/components/Badge';
import { CodeBlock } from '@/components/CodeBlock';

export default function HomePage() {
  const [apis, setApis] = useState<ApiRegistryItem[]>([]);
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getApis({ page_size: 6 }).catch(() => ({ data: [] })),
      api.getSystemOverview().catch(() => null),
    ]).then(([apisRes, overviewRes]) => {
      if (apisRes && 'data' in apisRes) {
        setApis(apisRes.data);
      }
      if (overviewRes && 'data' in overviewRes) {
        setOverview(overviewRes.data);
      }
      setLoading(false);
    });
  }, []);

  const curlDemo = `curl -X POST "http://localhost:8000/api/v1/image/upload" \\
  -H "X-API-Key: orv_live_demo_platform_key_2026_modular" \\
  -F "file=@image.jpg"`;

  return (
    <div className="relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/5 via-indigo-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <img
            src="/orvia-logo.png"
            alt="Orvia"
            className="h-12 sm:h-14 md:h-16 w-auto aspect-[3/1] object-contain"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Modular API Platform Foundation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          The Modular API Platform for Modern Engineering
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Orvia decouples API infrastructure from business logic. Centralized API registry, dynamic documentation, unified key management, and zero-friction extensibility.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/apis"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-sm hover:bg-white transition-all shadow-md"
          >
            <span>Explore API Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/docs"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium text-sm hover:bg-zinc-800 hover:text-white transition-all"
          >
            <Code2 className="w-4 h-4 text-zinc-400" />
            <span>Developer Docs</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 font-medium text-sm hover:text-zinc-200 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Console</span>
          </Link>
        </div>

        {/* Quickstart cURL snippet */}
        <div className="mt-12 max-w-3xl mx-auto text-left">
          <CodeBlock code={curlDemo} language="cURL" title="Quick Request Test (Instant Execution)" />
        </div>
      </section>

      {/* Platform Telemetry Bar */}
      <section className="border-y border-zinc-800/80 bg-[#0c0e14] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-bold font-mono text-zinc-100">
                {overview?.total_apis ?? 6}
              </p>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-mono mt-1">
                Registered APIs
              </p>
            </div>
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-bold font-mono text-zinc-100">
                {overview?.avg_latency_ms ? `${overview.avg_latency_ms} ms` : '< 25 ms'}
              </p>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-mono mt-1">
                Avg Response Time
              </p>
            </div>
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                99.9%
              </p>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-mono mt-1">
                Platform Uptime
              </p>
            </div>
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-bold font-mono text-zinc-100">
                Neon PG
              </p>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-mono mt-1">
                Serverless Storage
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modular Architecture Spotlight */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Engineered for Extreme Modularity
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Adding a new API requires zero modifications to existing services. Each API maintains isolated schemas, routes, rate limits, and documentation metadata.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-zinc-800 bg-[#0e1017] hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Central API Registry</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Every endpoint is tracked in a centralized PostgreSQL registry. Dynamic cataloging, category tagging, and automatic schema syncing.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-[#0e1017] hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Unified Key Auth</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Cryptographically hashed API keys with granular rate limits. Never stores plaintext secrets. Instant revocation support.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-[#0e1017] hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Interactive Sandbox</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Developers test APIs directly from documentation. Generates real-time request audits, latency measurements, and cURL commands.
            </p>
          </div>
        </div>
      </section>

      {/* Featured APIs Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Registered Platform APIs
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Synchronized directly from the Orvia central registry.
            </p>
          </div>
          <Link
            href="/apis"
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 font-mono"
          >
            <span>View All APIs ({apis.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {apis.map((item) => (
            <Link
              key={item.id}
              href={`/apis/${item.slug}`}
              className="group p-5 rounded-xl border border-zinc-800/80 bg-[#0e1017] hover:bg-[#12141e] hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <MethodBadge method={item.method} />
                    <CategoryBadge category={item.category} />
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="truncate max-w-[200px] text-zinc-400">{item.endpoint}</span>
                <span className="text-zinc-400">{item.rate_limit}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
