import React from 'react';

interface MethodBadgeProps {
  method: string;
  size?: 'sm' | 'md';
}

export function MethodBadge({ method, size = 'sm' }: MethodBadgeProps) {
  const m = method.toUpperCase();
  let color = 'bg-blue-950/60 text-blue-400 border-blue-800/60';
  if (m === 'POST') color = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
  if (m === 'DELETE') color = 'bg-rose-950/60 text-rose-400 border-rose-800/60';
  if (m === 'PUT') color = 'bg-amber-950/60 text-amber-400 border-amber-800/60';
  if (m === 'PATCH') color = 'bg-purple-950/60 text-purple-400 border-purple-800/60';

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm font-semibold';

  return (
    <span className={`inline-flex items-center font-mono font-medium rounded border ${color} ${sizeClasses}`}>
      {m}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = status.toLowerCase();
  let color = 'bg-zinc-800 text-zinc-300 border-zinc-700';
  let dotColor = 'bg-zinc-400';

  if (s === 'active') {
    color = 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50';
    dotColor = 'bg-emerald-400';
  } else if (s === 'beta') {
    color = 'bg-indigo-950/40 text-indigo-300 border-indigo-800/50';
    dotColor = 'bg-indigo-400';
  } else if (s === 'deprecated') {
    color = 'bg-amber-950/40 text-amber-300 border-amber-800/50';
    dotColor = 'bg-amber-400';
  } else if (s === 'disabled') {
    color = 'bg-red-950/40 text-red-300 border-red-800/50';
    dotColor = 'bg-red-400';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="capitalize">{s}</span>
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 capitalize">
      {category}
    </span>
  );
}
