'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Rocket, Key, Shield, Layers, FileText } from 'lucide-react';

const docsLinks = [
  { name: 'Introduction', href: '/docs', icon: BookOpen },
  { name: 'Quickstart', href: '/docs/getting-started', icon: Rocket },
  { name: 'Architecture', href: '/docs/architecture', icon: Layers },
  { name: 'Authentication', href: '/docs/authentication', icon: Shield },
  { name: 'API Keys', href: '/docs/api-keys', icon: Key },
  { name: 'Catalog Reference', href: '/apis', icon: FileText },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16">
      {/* Top Docs Navigation Pills (NO persistent sidebar) */}
      <div className="mb-8 pb-4 border-b border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          {docsLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-white font-semibold border border-zinc-700/80 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Full-Width Documentation Content */}
      <div className="w-full">{children}</div>
    </div>
  );
}
