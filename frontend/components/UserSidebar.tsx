'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Layers,
  LogOut,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { userNavigation, isRouteActive } from '@/config/navigation';

export function UserSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = async () => {
    if (onNavigate) onNavigate();
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0e14]">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-zinc-800 flex items-center shrink-0">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 shadow-sm">
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-white block">
              Orvia
            </span>
            <span className="text-[10px] text-zinc-400 font-mono block -mt-0.5">
              Developer Dashboard
            </span>
          </div>
        </Link>
      </div>

      {/* User Identity Card */}
      <div className="p-4 mx-3 my-3 rounded-xl border border-zinc-800 bg-zinc-900/40 shrink-0">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-bold text-xs text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-zinc-400 truncate font-mono">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[10px] font-mono">
          <span className="text-zinc-500">Access Role</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 uppercase font-semibold">
            {user.role}
          </span>
        </div>
      </div>

      {/* User Navigation List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {userNavigation.map((item) => {
          const isActive = isRouteActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-zinc-800 space-y-1 shrink-0">
        <Link
          href="/docs"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Documentation</span>
          <ExternalLink className="w-3 h-3 ml-auto text-zinc-500" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
