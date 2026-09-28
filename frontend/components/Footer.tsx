import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-[#07080c] py-12 text-sm text-zinc-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-zinc-900">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <img
                src="/orvia-logo.png"
                alt="Orvia"
                className="h-6 w-auto aspect-[3/1] object-contain"
              />
              <span className="text-xs text-zinc-500 font-mono">v1.0.0</span>
            </div>
            <p className="text-xs text-zinc-500 max-w-sm">
              Modular, production-ready API platform for scalable API management, centralized discovery, and automated documentation.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-xs">
            <div>
              <p className="font-semibold text-zinc-300 uppercase tracking-wider mb-2 font-mono">Platform</p>
              <ul className="space-y-1.5">
                <li><Link href="/apis" className="hover:text-zinc-300 transition-colors">API Catalog</Link></li>
                <li><Link href="/docs" className="hover:text-zinc-300 transition-colors">Documentation</Link></li>
                <li><Link href="/status" className="hover:text-zinc-300 transition-colors">System Status</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-zinc-300 uppercase tracking-wider mb-2 font-mono">Developer</p>
              <ul className="space-y-1.5">
                <li><Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Dashboard</Link></li>
                <li><Link href="/dashboard/api-keys" className="hover:text-zinc-300 transition-colors">API Keys</Link></li>
                <li><Link href="/docs/getting-started" className="hover:text-zinc-300 transition-colors">Quickstart</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-xs text-zinc-600 gap-4">
          <p>© {new Date().getFullYear()} Orvia Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              PostgreSQL (Neon) Connected
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
