"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";

interface InventoryLayoutProps {
  children: ReactNode;
}

const locations = [
  { name: "All Items", href: "/inventory", icon: "📦" },
  { name: "Fridge", href: "/inventory/fridge", icon: "🥶" },
  { name: "Freezer", href: "/inventory/freezer", icon: "🧊" },
  { name: "Pantry", href: "/inventory/pantry", icon: "🗄️" },
];

export default function InventoryLayout({ children }: InventoryLayoutProps) {
  const pathname = usePathname();

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Location tabs */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8" aria-label="Storage locations">
              {locations.map((location) => (
                <Link
                  key={location.href}
                  href={location.href}
                  className={cn(
                    "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    pathname === location.href
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <span className="text-lg">{location.icon}</span>
                  {location.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </AppShell>
  );
}