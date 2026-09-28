'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Key,
  BarChart3,
  BookOpen,
  ListOrdered,
  Settings,
  Shield,
  Loader2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const userNav = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My API Keys', href: '/dashboard/api-keys', icon: Key },
  { name: 'API Usage', href: '/dashboard/usage', icon: BarChart3 },
  { name: 'API Documentation', href: '/docs', icon: BookOpen },
  { name: 'Request Logs', href: '/dashboard/logs', icon: ListOrdered },
  { name: 'Account Settings', href: '/dashboard/settings', icon: Settings },
];

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs font-mono text-zinc-500">Authenticating user session...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* User Sidebar */}
        <aside className="w-full md:w-60 shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* User Profile Mini Card */}
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#0e1017]">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] font-mono">
                <span className="text-zinc-500">Role</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase font-semibold">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {userNav.map((item) => {
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

            {/* If user is Admin, provide direct switch to Admin Panel */}
            {isAdmin && (
              <div className="pt-2">
                <Link
                  href="/admin"
                  className="flex items-center justify-between p-3 rounded-xl border border-indigo-900/50 bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-300 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold">Switch to Admin Panel</span>
                  </div>
                  <span>&rarr;</span>
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Dashboard Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
