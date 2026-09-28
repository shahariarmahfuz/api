'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Layers, ArrowRight, ShieldCheck, Lock, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { ApiRegistryItem, CategorySummary } from '@/types';
import { MethodBadge, StatusBadge, CategoryBadge } from '@/components/Badge';

export default function ApiCatalogPage() {
  const [apis, setApis] = useState<ApiRegistryItem[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCatalog();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    api.getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await api.getApis({
        category: selectedCategory,
        search: searchQuery || undefined,
        page_size: 50,
      });
      setApis(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredApis = apis.filter((apiItem) => {
    if (selectedMethod !== 'all' && apiItem.method.toUpperCase() !== selectedMethod) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">API Catalog</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Discover, inspect, and integrate modular APIs registered on the Orvia platform.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search APIs by name, endpoint, or keyword..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        {/* Method filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
          {['all', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMethod(m)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                selectedMethod === m
                  ? 'bg-zinc-100 text-zinc-950 font-bold border-zinc-100'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-zinc-800/80">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setSelectedCategory(cat.category)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize transition-colors flex items-center gap-1.5 ${
              selectedCategory === cat.category
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <span>{cat.category}</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* API Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-6 rounded-xl border border-zinc-800/60 bg-zinc-900/30 animate-pulse h-48"
            />
          ))}
        </div>
      ) : filteredApis.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
          <Layers className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">No APIs found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or selecting a different category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApis.map((apiItem) => (
            <Link
              key={apiItem.id}
              href={`/apis/${apiItem.slug}`}
              className="group p-5 rounded-xl border border-zinc-800/80 bg-[#0e1017] hover:bg-[#12141e] hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <MethodBadge method={apiItem.method} />
                    <CategoryBadge category={apiItem.category} />
                  </div>
                  <StatusBadge status={apiItem.status} />
                </div>

                <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  {apiItem.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">
                  {apiItem.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span className="truncate max-w-[200px] text-zinc-400">
                    {apiItem.endpoint}
                  </span>
                  <span className="text-zinc-400">{apiItem.rate_limit}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    {apiItem.authentication_required ? (
                      <>
                        <Lock className="w-3 h-3 text-zinc-400" />
                        <span>API Key Required</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3 text-emerald-400" />
                        <span>Public Access</span>
                      </>
                    )}
                  </span>
                  <span className="flex items-center gap-1 group-hover:text-emerald-400 transition-colors font-medium">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
