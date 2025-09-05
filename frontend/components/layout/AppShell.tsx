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

// Protected routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/inventory", "/shopping", "/reports", "/settings"];

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const checkAuthFromStore = useAuthStore((state) => state.checkAuth);
  const isAuthenticatedFromStore = useAuthStore((state) => state.isAuthenticated);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Enable real-time notifications
  useRealtimeNotifications();

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      // Always check auth from store
      checkAuthFromStore();
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, checkAuthFromStore]);

  useEffect(() => {
    // Handle protected route access
    if (!isLoading) {
      const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
      
      if (isProtectedRoute && !isAuthenticatedFromStore) {
        // Check if we have tokens in localStorage (might be in the process of authenticating)
        const hasToken = localStorage.getItem('access_token');
        if (!hasToken) {
          // Only redirect if we truly have no auth tokens
          router.push("/login");
        } else {
          // We have tokens, re-check auth state
          checkAuthFromStore();
        }
      }
    }
  }, [isAuthenticatedFromStore, isLoading, pathname, router, checkAuthFromStore]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // For public routes, render children directly
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  if (isPublicRoute || !isAuthenticatedFromStore) {
    return <>{children}</>;
  }

  // For authenticated routes, render with app shell
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      <Toast />
      
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - No mobile menu toggle needed with bottom tab bar */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <span className="text-2xl ml-2 lg:ml-0">🥦</span>
                <span className="ml-2 text-xl font-bold text-gray-900">Fridgr</span>
              </Link>
            </div>

            {/* Right side navigation */}
            <div className="flex items-center space-x-4">
              {/* Household Switcher */}
              <HouseholdSwitcher />
              
              {/* Quick Add Button */}
              <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Notifications */}
              <NotificationBell />

              {/* User Avatar */}
              <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-medium">JS</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation - Hidden on mobile (< 768px) */}
      <aside className={`
        fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        hidden md:block
      `}>
        <nav className="h-full px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <Link 
                href="/dashboard"
                className={`flex items-center p-2 rounded-lg hover:bg-gray-100 ${
                  pathname === '/dashboard' ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
            </li>
            
            <li>
              <div className="text-gray-900 p-2">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Inventory
                </div>
                <ul className="ml-8 mt-2 space-y-1">
                  <li>
                    <Link href="/inventory/fridge" className="block p-2 rounded-lg hover:bg-gray-100 text-gray-700">
                      Fridge
                    </Link>
                  </li>
                  <li>
                    <Link href="/inventory/freezer" className="block p-2 rounded-lg hover:bg-gray-100 text-gray-700">
                      Freezer
                    </Link>
                  </li>
                  <li>
                    <Link href="/inventory/pantry" className="block p-2 rounded-lg hover:bg-gray-100 text-gray-700">
                      Pantry
                    </Link>
                  </li>
                </ul>
              </div>
            </li>

            <li>
              <Link 
                href="/shopping"
                className={`flex items-center p-2 rounded-lg hover:bg-gray-100 ${
                  pathname === '/shopping' ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Shopping
              </Link>
            </li>

            <li>
              <Link 
                href="/reports"
                className={`flex items-center p-2 rounded-lg hover:bg-gray-100 ${
                  pathname === '/reports' ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Reports
              </Link>
            </li>

            <li>
              <Link 
                href="/settings"
                className={`flex items-center p-2 rounded-lg hover:bg-gray-100 ${
                  pathname === '/settings' ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={`
        pt-16 transition-all duration-300 ease-in-out
        md:pl-64 lg:pl-64
        pb-16 md:pb-0
      `}>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer - Hidden on mobile */}
      <footer className={`
        bg-white border-t border-gray-200 mt-auto
        transition-all duration-300 ease-in-out
        md:ml-64 lg:ml-64
        hidden md:block
      `}>
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            © 2024 Fridgr · Help · Privacy · Terms
          </div>
        </div>
      </footer>

      {/* Mobile Tab Bar - Only visible on mobile */}
      <MobileTabBar />
    </div>
  );
}