import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { SideMenu } from '@/components/SideMenu';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

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
    <html lang="en" className={`dark h-full bg-black ${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-full flex flex-col bg-black text-zinc-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <AuthProvider>
          <SideMenu />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
