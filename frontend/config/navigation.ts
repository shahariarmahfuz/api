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
 * 1. Public Website Navigation
 * Rendered strictly in the Public Top Navbar.
 * Used on public routes: /, /apis, /docs, /status, /login, /signup
 * Never includes Dashboard or Admin links.
 */
export const publicNavigation: NavItem[] = [
  { name: 'APIs', href: '/apis', icon: Layers },
  { name: 'Documentation', href: '/docs', icon: BookOpen },
  { name: 'Status', href: '/status', icon: Activity },
];

/**
 * 2. Authenticated Developer Dashboard Sidebar Navigation
 * Rendered strictly in the Dashboard Sidebar layout.
 * Used on all /dashboard/* routes.
 * Never includes Admin navigation.
 */
export const userNavigation: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'APIs', href: '/dashboard/apis', icon: Layers },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { name: 'Usage', href: '/dashboard/usage', icon: BarChart3 },
  { name: 'Request Logs', href: '/dashboard/logs', icon: ListOrdered },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

/**
 * 3. Administrator Sidebar Navigation
 * Rendered strictly in the Admin Sidebar layout.
 * Used on all /admin/* routes.
 * Never includes normal user dashboard navigation.
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
 * Resolves layout and navigation context based on:
 * 1. Authentication state
 * 2. User role
 * 3. Current route path
 */
export function getNavigationContext(
  pathname: string,
  isAuthenticated: boolean,
  isAdmin: boolean
): NavigationContext {
  if (pathname.startsWith('/admin')) {
    return isAdmin ? 'admin' : 'user';
  }
  if (pathname.startsWith('/dashboard')) {
    return 'user';
  }
  return 'public';
}

/**
 * Determines whether a given navigation link is active based on the current pathname.
 * Prevents false positive matching for root paths (/dashboard, /admin, /).
 */
export function isRouteActive(pathname: string, href: string, exact: boolean = false): boolean {
  if (exact || href === '/dashboard' || href === '/admin' || href === '/') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
