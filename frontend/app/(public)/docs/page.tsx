import React from 'react';
import Link from 'next/link';
import { ArrowRight, Layers, Key, Shield, Zap } from 'lucide-react';
import { CodeBlock } from '@/components/CodeBlock';

export default function DocsIndexPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Orvia Documentation
        </h1>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          Welcome to the developer documentation for Orvia — a production-ready, modular API platform. Learn how to authenticate, consume APIs, and extend the platform.
        </p>
      </div>

      {/* Grid of quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/docs/getting-started"
          className="p-5 rounded-xl border border-zinc-800 bg-[#0e1017] hover:border-zinc-700 hover:bg-[#12141f] transition-all group"
        >
          <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-emerald-400 mb-3">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-emerald-300">Quickstart Guide</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Make your first authenticated request to Orvia in under 2 minutes.
          </p>
        </Link>

        <Link
          href="/docs/authentication"
          className="p-5 rounded-xl border border-zinc-800 bg-[#0e1017] hover:border-zinc-700 hover:bg-[#12141f] transition-all group"
        >
          <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-indigo-400 mb-3">
            <Shield className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-indigo-300">Authentication & Keys</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Learn about API key hashing, authorization headers, and rate limits.
          </p>
        </Link>

        <Link
          href="/docs/architecture"
          className="p-5 rounded-xl border border-zinc-800 bg-[#0e1017] hover:border-zinc-700 hover:bg-[#12141f] transition-all group"
        >
          <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-cyan-400 mb-3">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300">Modular Architecture</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Understand how APIs are decoupled into autonomous modules and schemas.
          </p>
        </Link>

        <Link
          href="/apis"
          className="p-5 rounded-xl border border-zinc-800 bg-[#0e1017] hover:border-zinc-700 hover:bg-[#12141f] transition-all group"
        >
          <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-amber-400 mb-3">
            <Key className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-amber-300">API Catalog</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Browse all live endpoints, schemas, parameters, and test responses.
          </p>
        </Link>
      </div>

      {/* Core Principles */}
      <section className="p-6 rounded-xl border border-zinc-800 bg-[#0e1017] space-y-4">
        <h2 className="text-lg font-bold text-white">Platform Standards</h2>
        <ul className="space-y-3 text-xs text-zinc-300">
          <li className="flex items-start gap-2">
            <span className="font-mono text-emerald-400 font-bold">•</span>
            <span><strong>Consistent Response Envelope:</strong> Every response adheres to a predictable structure with <code className="text-zinc-200">success</code>, <code className="text-zinc-200">data</code>, and unique <code className="text-zinc-200">request_id</code>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono text-emerald-400 font-bold">•</span>
            <span><strong>Versioned Endpoints:</strong> All APIs reside under immutable version prefixes (e.g., <code className="text-zinc-200">/api/v1/...</code>).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-mono text-emerald-400 font-bold">•</span>
            <span><strong>Full Audit Logging:</strong> Every request is stamped with an <code className="text-zinc-200">X-Request-ID</code> header and tracked for latency and status telemetry.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
