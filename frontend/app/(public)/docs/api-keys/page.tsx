import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Key, Lock, AlertTriangle } from 'lucide-react';

export default function ApiKeysDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          API Key Architecture & Security
        </h1>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          How Orvia generates, hashes, and validates API keys securely.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Cryptographic Storage</h2>
        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#050505] space-y-3 text-xs text-zinc-300">
          <p>
            When a key is generated in Orvia:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-zinc-400">
            <li>A high-entropy 20-byte random string is generated with the <code className="text-zinc-200">orv_live_</code> prefix.</li>
            <li>A SHA-256 hash is computed and stored in the database. <strong>The plaintext secret key is never stored</strong>.</li>
            <li>A short identification prefix (e.g. <code className="text-zinc-200">orv_live_9f8a...</code>) is saved for dashboard display.</li>
            <li>The full secret key is displayed <strong>only once</strong> upon creation.</li>
          </ol>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Best Practices</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-white/[0.08] bg-[#050505]">
            <Lock className="w-5 h-5 text-emerald-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Environment Variables</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Store API keys strictly in environment variables on your server. Never check them into version control.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.08] bg-[#050505]">
            <AlertTriangle className="w-5 h-5 text-amber-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Instant Revocation</h3>
            <p className="text-xs text-zinc-400 mt-1">
              If an API key is accidentally exposed, immediately revoke it in the <Link href="/dashboard/api-keys" className="text-emerald-400 hover:underline">API Keys</Link> dashboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
