import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Key,
  BarChart3,
  ListOrdered,
  Settings,
  Users,
  Shield,
  Activity,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

/**
 * 1. Public Navigation
 * Accessible to all visitors and unauthenticated users.
 * Never includes Dashboard, Admin Panel, or internal data views.
 */
export const publicNavigation: NavItem[] = [
  { name: 'APIs', href: '/apis', icon: Layers },
  { name: 'Documentation', href: '/docs', icon: BookOpen },
  { name: 'Status', href: '/status', icon: Activity },
];

/**
 * 2. Normal User Navigation (Developer / User Dashboard)
 * Context: /dashboard/*
 * Scoped strictly to the authenticated user's credentials and analytics.
 * Never includes platform-wide admin controls.
 */
export const userNavigation: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'APIs', href: '/apis', icon: Layers },
  { name: 'Documentation', href: '/docs', icon: BookOpen },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { name: 'Usage', href: '/dashboard/usage', icon: BarChart3 },
  { name: 'Request Logs', href: '/dashboard/logs', icon: ListOrdered },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

/**
 * 3. Administrator Navigation (Admin Panel)
 * Context: /admin/*
 * Platform-wide governance, user management, and catalog control.
 * Never mixes user-specific dashboard items.
 */
export const adminNavigation: NavItem[] = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'APIs Registry', href: '/admin/apis', icon: Layers },
  { name: 'API Keys', href: '/admin/api-keys', icon: Key },
  { name: 'API Requests', href: '/admin/requests', icon: ListOrdered },
  { name: 'Platform Settings', href: '/admin/settings', icon: Settings },
];

export type NavigationContext = 'public' | 'user' | 'admin';

/**
 * Resolves navigation context based on:
 * 1. Authentication state
 * 2. User role
 * 3. Current route
 */
export function getNavigationContext(
  pathname: string,
  isAuthenticated: boolean,
  isAdmin: boolean
): NavigationContext {
  if (!isAuthenticated) {
    return 'public';
  }
  if (pathname.startsWith('/admin')) {
    return isAdmin ? 'admin' : 'user';
  }
  if (pathname.startsWith('/dashboard')) {
    return 'user';
  }
  return 'public';
}

/**
 * Checks if a nav link is active for the current pathname.
 * Avoids false positive root matching (e.g., /dashboard when viewing /dashboard/api-keys).
 */
export function isRouteActive(pathname: string, href: string, exact: boolean = false): boolean {
  if (exact || href === '/dashboard' || href === '/admin' || href === '/') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
