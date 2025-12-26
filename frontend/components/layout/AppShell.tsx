"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { HouseholdSwitcher } from "@/components/households/HouseholdSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Toast } from "@/components/notifications/Toast";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { useAuthStore } from "@/stores/auth.store";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { cn } from "@/lib/utils";
import {
  Home,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Plus,
  Snowflake,
  Warehouse,
  LayoutGrid,
} from "lucide-react";
import { ChatInput } from "@/components/chat";

// Protected routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/inventory", "/shopping", "/reports", "/settings"];

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  {
    name: "Inventory",
    icon: Package,
    children: [
      { name: "All Items", href: "/inventory", icon: LayoutGrid },
      { name: "Fridge", href: "/inventory/fridge", icon: Snowflake },
      { name: "Freezer", href: "/inventory/freezer", icon: Snowflake },
      { name: "Pantry", href: "/inventory/pantry", icon: Warehouse },
    ],
  },
  { name: "Shopping", href: "/shopping", icon: ShoppingCart },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const checkAuthFromStore = useAuthStore((state) => state.checkAuth);
  const isAuthenticatedFromStore = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNav, setExpandedNav] = useState<string | null>(null);

  // Enable real-time notifications
  useRealtimeNotifications();

  useEffect(() => {
    const checkAuth = () => {
      checkAuthFromStore();
      setIsLoading(false);
    };
    checkAuth();
  }, [pathname, checkAuthFromStore]);

  useEffect(() => {
    if (!isLoading) {
      const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

      if (isProtectedRoute && !isAuthenticatedFromStore) {
        const hasToken = localStorage.getItem('access_token');
        if (!hasToken) {
          router.push("/login");
        } else {
          checkAuthFromStore();
        }
      }
    }
  }, [isAuthenticatedFromStore, isLoading, pathname, router, checkAuthFromStore]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 animate-pulse flex items-center justify-center">
              <span className="text-4xl">🥦</span>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-2 bg-primary-200/50 rounded-full blur-sm" />
          </div>
          <div className="text-primary-600 font-bold text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  // For public routes, render children directly
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  if (isPublicRoute || !isAuthenticatedFromStore) {
    return <>{children}</>;
  }

  // Get user initials
  const userInitials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // For authenticated routes, render with app shell
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      {/* Toast Notifications */}
      <Toast />

      {/* Top Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b-2 border-gray-100 fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="relative">
                  <span className="text-3xl transition-transform group-hover:scale-110 inline-block">🥦</span>
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary-500/20 rounded-full blur-sm" />
                </div>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                  Pantrybot
                </span>
              </Link>
            </div>

            {/* Right side navigation */}
            <div className="flex items-center gap-3">
              {/* Household Switcher */}
              <HouseholdSwitcher />

              {/* Quick Add Button */}
              <button className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-95">
                <Plus className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <NotificationBell />

              {/* User Avatar */}
              <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">{userInitials}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation - Hidden on mobile */}
      <aside className="fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white/80 backdrop-blur-xl border-r-2 border-gray-100 hidden md:block">
        <nav className="h-full px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = item.href && (pathname === item.href || pathname.startsWith(item.href + '/'));
              const isExpanded = expandedNav === item.name || (item.children && pathname.startsWith('/inventory'));
              const Icon = item.icon;

              if (item.children) {
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => setExpandedNav(isExpanded ? null : item.name)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl font-semibold transition-all duration-200",
                        isExpanded
                          ? "bg-primary-100 text-primary-700"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isExpanded ? "bg-primary-200" : "bg-gray-100"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {item.name}
                      <svg
                        className={cn(
                          "w-4 h-4 ml-auto transition-transform",
                          isExpanded && "rotate-180"
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <ul className="mt-2 ml-4 space-y-1 animate-slide-up">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href;
                          const ChildIcon = child.icon;
                          return (
                            <li key={child.name}>
                              <Link
                                href={child.href}
                                className={cn(
                                  "flex items-center gap-3 p-2.5 pl-4 rounded-xl font-medium transition-all duration-200",
                                  isChildActive
                                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                                    : "text-gray-600 hover:bg-gray-100"
                                )}
                              >
                                <ChildIcon className="w-4 h-4" />
                                {child.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.name}>
                  <Link
                    href={item.href!}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl font-semibold transition-all duration-200",
                      isActive
                        ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive ? "bg-white/20" : "bg-gray-100"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Footer in sidebar */}
          <div className="absolute bottom-6 left-4 right-4">
            <div className="p-4 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl border-2 border-primary-100">
              <p className="text-sm font-semibold text-gray-700 mb-1">Need help?</p>
              <p className="text-xs text-gray-500 mb-3">Check out our guides and tips</p>
              <button className="w-full py-2 px-4 bg-white rounded-xl text-sm font-bold text-primary-600 hover:bg-primary-50 transition-colors shadow-sm">
                View Guides
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="pt-16 transition-all duration-300 ease-in-out md:pl-64 pb-32 md:pb-24">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Floating Chat Input */}
      <div className="md:pl-64">
        <ChatInput className="mb-16 md:mb-0" />
      </div>

      {/* Mobile Tab Bar - Only visible on mobile */}
      <MobileTabBar />
    </div>
  );
}
