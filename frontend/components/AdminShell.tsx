"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { User } from "@/types";
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  X,
} from "lucide-react";

interface AdminShellProps {
  children: React.ReactNode;
  activeTab?: "dashboard" | "queue" | "cases" | "businesses";
}

export function AdminShell({ children, activeTab = "dashboard" }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  async function checkAdminAuth() {
    try {
      const user = await api.auth.me();
      if (!user || (!user.is_staff && !user.is_superuser)) {
        router.push("/admin/login?error=unauthorized");
        return;
      }
      setCurrentUser(user);
    } catch {
      router.push("/admin/login");
    } finally {
      setAuthChecked(true);
    }
  }

  async function handleLogout() {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    }
    router.push("/admin/login");
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
            Verifying Compliance Officer Credentials...
          </p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { id: "dashboard", label: "Control Room", href: "/admin" },
    { id: "queue", label: "Review Queue", href: "/admin/cases?status=HUMAN_REVIEW" },
    { id: "cases", label: "All Cases", href: "/admin/cases" },
    { id: "businesses", label: "Businesses & Profiles", href: "/admin/businesses" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      {/* Top Admin Control Bar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Mode Tag */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-foreground leading-none">
                  ComplyWise
                </span>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 tracking-wider uppercase mt-0.5">
                  Control Room &bull; Admin Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive =
                (item.id === "dashboard" && pathname === "/admin") ||
                (item.id === "queue" && pathname === "/admin/cases" && typeof window !== "undefined" && window.location.search.includes("HUMAN_REVIEW")) ||
                (item.id === "cases" && pathname.startsWith("/admin/cases") && !pathname.includes("HUMAN_REVIEW")) ||
                (item.id === "businesses" && pathname.startsWith("/admin/businesses"));

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Header Controls & Officer Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-foreground truncate max-w-[160px]">
                {currentUser?.full_name || currentUser?.email || "Admin Officer"}
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.2 rounded">
                STAFF
              </span>
            </div>

            <Link
              href="/cases"
              title="Switch to User Site"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">User Site</span>
            </Link>

            <button
              onClick={handleLogout}
              title="Sign out of Admin Portal"
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border px-4 py-3 bg-background space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default AdminShell;
