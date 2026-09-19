"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Wallet,
  ArrowLeftRight,
  Upload,
  CreditCard,
  RotateCcw,
  Link2,
  Settings as SettingsIcon,
} from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/periods", label: "Periods", icon: Calendar },
    { path: "/accounts", label: "Accounts", icon: Wallet },
    { path: "/transactions", label: "Transactions", icon: ArrowLeftRight },
    { path: "/uploads", label: "Uploads", icon: Upload },
    { path: "/loans", label: "Loans", icon: CreditCard },
    { path: "/subscriptions", label: "Subscriptions", icon: RotateCcw },
    { path: "/associations", label: "Associations", icon: Link2 },
    { path: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path);
  };

  return (
    <div className="flex h-screen w-full">
      {/* Side Navigation */}
      <aside className="w-64 bg-zinc-900 text-white flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-xl font-semibold">Expenses</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                    }`}
                  >
                    <Icon className="size-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-zinc-50">{children}</main>
    </div>
  );
}
