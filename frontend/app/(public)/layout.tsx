import React from 'react';
import { Footer } from '@/components/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-zinc-100">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
