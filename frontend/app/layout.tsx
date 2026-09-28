import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Orvia — Modular API Platform',
  description: 'Production-ready, scalable modular API platform for API discovery, management, and developer documentation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-[#090a0f] text-zinc-100">
      <body className="min-h-full flex flex-col bg-[#090a0f] text-zinc-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
