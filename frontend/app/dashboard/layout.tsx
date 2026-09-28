'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Key,
  ListOrdered,
  Settings,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

const dashboardNav = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'APIs Registry', href: '/dashboard/apis', icon: Layers },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { name: 'Request Logs', href: '/dashboard/logs', icon: ListOrdered },
  { name: 'Settings & DB', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Dashboard Sidebar */}
        <aside className="w-full md:w-56 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                Console
              </p>
              <p className="text-xs text-zinc-400 mt-1">Platform Management</p>
            </div>

            <nav className="space-y-1">
              {dashboardNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-800 text-white font-semibold border border-zinc-700/60'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-zinc-400" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#0e1017] space-y-2 text-xs">
              <span className="text-zinc-500 font-mono block text-[11px] uppercase">
                FastAPI Docs
              </span>
              <p className="text-zinc-400 text-xs">Explore raw OpenAPI schemas and Swagger.</p>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium font-mono text-[11px]"
              >
                <span>Swagger UI</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </aside>

        {/* Dashboard Main Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
