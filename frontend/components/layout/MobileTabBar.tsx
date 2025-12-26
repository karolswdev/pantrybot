"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Package, Plus, ShoppingCart, Settings } from "lucide-react";

const tabs = [
  {
    name: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Inventory",
    href: "/inventory/fridge",
    icon: Package,
  },
  {
    name: "Add",
    href: "#",
    icon: Plus,
    isSpecial: true,
  },
  {
    name: "Shopping",
    href: "/shopping",
    icon: ShoppingCart,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // TODO: Implement quick add modal
    console.log("Quick add clicked");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t-2 border-gray-100 block md:hidden safe-area-pb">
      <div className="grid grid-cols-5 h-20 px-2">
        {tabs.map((tab) => {
          const isActive = tab.href !== "#" &&
            (pathname === tab.href ||
             (tab.href === "/inventory/fridge" && pathname.startsWith("/inventory")));
          const Icon = tab.icon;

          if (tab.isSpecial) {
            return (
              <button
                key={tab.name}
                onClick={handleAddClick}
                className="flex flex-col items-center justify-center -mt-4"
                aria-label={tab.name}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-500/30 transition-all duration-200 hover:shadow-2xl hover:shadow-primary-500/40 hover:-translate-y-1 active:scale-95">
                  <Icon className="w-7 h-7" />
                </div>
              </button>
            );
          }

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 transition-all duration-200",
                isActive
                  ? "text-primary-600"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-primary-100 shadow-sm"
                  : "bg-transparent"
              )}>
                <Icon className={cn(
                  "w-6 h-6 transition-transform",
                  isActive && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-xs font-semibold transition-colors",
                isActive ? "text-primary-600" : "text-gray-400"
              )}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
