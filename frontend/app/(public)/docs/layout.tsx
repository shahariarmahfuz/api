'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Rocket, Key, Shield, Layers, HelpCircle, FileText } from 'lucide-react';

const docsNav = [
  {
    category: 'Getting Started',
    items: [
      { name: 'Introduction', href: '/docs', icon: BookOpen },
      { name: 'Quickstart', href: '/docs/getting-started', icon: Rocket },
      { name: 'Modular Architecture', href: '/docs/architecture', icon: Layers },
    ],
  },
  {
    category: 'Security & Auth',
    items: [
      { name: 'Authentication', href: '/docs/authentication', icon: Shield },
      { name: 'API Keys', href: '/docs/api-keys', icon: Key },
    ],
  },
  {
    category: 'API Reference',
    items: [
      { name: 'Catalog Reference', href: '/apis', icon: FileText },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-10">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Developer Docs
              </p>
              <p className="text-xs text-zinc-400">
                Integration guides, authentication, and architectural standards.
              </p>
            </div>

            <nav className="space-y-6">
              {docsNav.map((section, idx) => (
                <div key={idx}>
                  <p className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    {section.category}
                  </p>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isActive
                                ? 'bg-zinc-800 text-white font-semibold'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
