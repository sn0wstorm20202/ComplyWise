"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Business, User } from "@/types";
import ComplyWiseLogo from "./icons/ComplyWiseLogo";
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Layers,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export interface AssessmentItem {
  id: string;
  assessment_number: number;
  title: string;
  status: string;
  created_at?: string | null;
  completed_at?: string | null;
}

interface AdminShellProps {
  children: React.ReactNode;
  activeBusinessId?: string | null;
  activeAssessmentId?: string | null;
  activeTab?: string;
  onSelectBusiness?: (businessId: string | null) => void;
  onSelectAssessment?: (assessmentId: string | null) => void;
  assessments?: AssessmentItem[];
  currentBusinessName?: string | null;
}

export function AdminShell({
  children,
  activeBusinessId: controlledBusinessId,
  activeAssessmentId: controlledAssessmentId,
  onSelectBusiness,
  onSelectAssessment,
  assessments: passedAssessments = [],
  currentBusinessName,
}: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Business Selector State
  const [businessDropdownOpen, setBusinessDropdownOpen] = useState(false);
  const [businessesList, setBusinessesList] = useState<Business[]>([]);
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  // Assessment Selector State
  const [assessmentDropdownOpen, setAssessmentDropdownOpen] = useState(false);
  const [internalAssessments, setInternalAssessments] = useState<AssessmentItem[]>(passedAssessments);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  // Derive active business from props or URL
  const urlBusinessId = searchParams?.get("business_id") || null;
  const activeBusinessId = controlledBusinessId !== undefined ? controlledBusinessId : urlBusinessId;

  // Derive active assessment from props or URL
  const urlAssessmentId = searchParams?.get("assessment_id") || null;
  const activeAssessmentId = controlledAssessmentId !== undefined ? controlledAssessmentId : urlAssessmentId;

  const businessDropdownRef = useRef<HTMLDivElement>(null);
  const assessmentDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (businessDropdownRef.current && !businessDropdownRef.current.contains(event.target as Node)) {
        setBusinessDropdownOpen(false);
      }
      if (assessmentDropdownRef.current && !assessmentDropdownRef.current.contains(event.target as Node)) {
        setAssessmentDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auth verification
  const checkAdminAuth = useCallback(async () => {
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
  }, [router]);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  // Load registered businesses for the business selector
  useEffect(() => {
    if (!authChecked) return;
    let isMounted = true;
    setLoadingBusinesses(true);
    api.businesses
      .getAdminBusinesses()
      .then((res) => {
        if (isMounted && res?.businesses) {
          setBusinessesList(res.businesses);
        }
      })
      .catch((err) => {
        console.error("Failed to load admin businesses for selector:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingBusinesses(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authChecked]);

  // Synchronize assessments list when active business changes
  useEffect(() => {
    if (passedAssessments && passedAssessments.length > 0) {
      setInternalAssessments(passedAssessments);
      return;
    }
    if (!activeBusinessId) {
      setInternalAssessments([]);
      return;
    }

    let isMounted = true;
    setLoadingAssessments(true);
    api.businesses
      .getAssessments(activeBusinessId)
      .then((res) => {
        if (isMounted && Array.isArray(res)) {
          setInternalAssessments(
            res.map((a: any) => ({
              id: a.id,
              assessment_number: a.assessment_number || 1,
              title: a.title || `Assessment #${a.assessment_number || 1}`,
              status: a.status || "COMPLETED",
              created_at: a.created_at,
              completed_at: a.completed_at,
            }))
          );
        }
      })
      .catch(() => {
        if (isMounted) setInternalAssessments([]);
      })
      .finally(() => {
        if (isMounted) setLoadingAssessments(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeBusinessId, passedAssessments]);

  // Find active business details
  const activeBusinessObj = businessesList.find((b) => b.id === activeBusinessId);
  const resolvedBusinessName =
    currentBusinessName ||
    activeBusinessObj?.name ||
    (activeBusinessId ? `Enterprise ${activeBusinessId.slice(0, 8)}...` : null);

  // Find active assessment details
  const activeAssessmentObj = internalAssessments.find((a) => a.id === activeAssessmentId);

  // Business selection handler
  function handleSelectBusiness(bizId: string | null) {
    setBusinessDropdownOpen(false);
    setBusinessSearchQuery("");
    if (onSelectBusiness) {
      onSelectBusiness(bizId);
    } else {
      if (bizId) {
        router.push(`/admin?business_id=${bizId}`);
      } else {
        router.push(`/admin`);
      }
    }
  }

  // Assessment selection handler
  function handleSelectAssessment(assId: string | null) {
    setAssessmentDropdownOpen(false);
    if (onSelectAssessment) {
      onSelectAssessment(assId);
    } else {
      if (activeBusinessId && assId) {
        router.push(`/admin?business_id=${activeBusinessId}&assessment_id=${assId}`);
      } else if (activeBusinessId) {
        router.push(`/admin?business_id=${activeBusinessId}`);
      }
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
      <div className="min-h-screen bg-[#EDEFF2] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#18181B] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-[#64748B] tracking-wide uppercase">
            Verifying Compliance Officer Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Filter businesses in dropdown
  const filteredBusinesses = businessesList.filter((b) => {
    if (!businessSearchQuery.trim()) return true;
    const q = businessSearchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      (b.primary_state && b.primary_state.toLowerCase().includes(q)) ||
      (b.incorporation_type && b.incorporation_type.toLowerCase().includes(q)) ||
      b.id.toLowerCase().includes(q)
    );
  });

  const navLinks = [
    { id: "control-room", label: "Scrutiny Control Room", href: activeBusinessId ? `/admin?business_id=${activeBusinessId}` : "/admin" },
    { id: "queue", label: "Review Queue", href: "/admin/cases?status=HUMAN_REVIEW" },
    { id: "cases", label: "All Cases", href: "/admin/cases" },
    { id: "businesses", label: "Enterprise Registry", href: "/admin/businesses" },
  ];

  return (
    <div className="min-h-screen bg-[#EDEFF2] p-2 sm:p-4 lg:p-6 flex flex-col justify-center relative overflow-x-hidden antialiased">
      {/* Floating Application Window Container */}
      <div className="w-full max-w-[1440px] mx-auto bg-white rounded-[24px] border border-[#E2E8F0] overflow-hidden flex flex-col min-h-[900px] shadow-xl relative z-10">
        
        {/* Top Header Navigation */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[#F0F2F5] flex items-center justify-between bg-white sticky top-0 z-30 select-none shadow-2xs">
          {/* Left: Brand Identity + Primary Nav Pills */}
          <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Open mobile navigation"
              className="lg:hidden h-8 w-8 rounded-[8px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Brand Logo & Name */}
            <Link href="/admin" className="flex items-center group cursor-pointer">
              <ComplyWiseLogo className="h-7 w-7 text-[#0F172A] transition-transform group-hover:scale-105" showSubtitle={false} />
              <div className="flex flex-col ml-2.5">
                <span className="font-bold text-sm tracking-tight text-[#0F172A] leading-none">
                  ComplyWise
                </span>
                <span className="text-[10px] font-bold text-[#64748B] tracking-wider uppercase mt-0.5">
                  Control Room &bull; Governance
                </span>
              </div>
            </Link>

            {/* Primary Segmented Navigation Pills */}
            <nav aria-label="Admin Navigation" className="hidden lg:flex items-center p-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-medium">
              {navLinks.map((item) => {
                const isActive =
                  (item.id === "control-room" && pathname === "/admin") ||
                  (item.id === "queue" && pathname === "/admin/cases" && typeof window !== "undefined" && window.location.search.includes("HUMAN_REVIEW")) ||
                  (item.id === "cases" && pathname.startsWith("/admin/cases") && !pathname.includes("HUMAN_REVIEW")) ||
                  (item.id === "businesses" && pathname.startsWith("/admin/businesses"));

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#18181B] border border-[#18181B] text-white font-medium shadow-xs"
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-black/[0.03]"
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Switcher & User Profile Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Site Switcher */}
            <Link
              href={activeBusinessId ? `/dashboard?business_id=${activeBusinessId}` : "/dashboard"}
              title="Switch to Customer Site"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] shadow-2xs transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>User Dashboard</span>
            </Link>

            {/* Officer Profile Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[#0F172A] truncate max-w-[140px]">
                {currentUser?.full_name || currentUser?.email || "Compliance Officer"}
              </span>
              <span className="text-[10px] font-mono font-bold text-[#18181B] bg-white border border-[#E2E8F0] px-1.5 py-0.2 rounded-full">
                STAFF
              </span>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              title="Sign out of Admin Portal"
              className="h-8 w-8 rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B] hover:text-rose-600 transition-colors shadow-2xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Persistent Scrutiny Selector Bar */}
        <div className="border-b border-[#E2E8F0] bg-[#FAFAFA] px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* 1. ACTIVE BUSINESS SELECTOR (§5) */}
            <div className="relative" ref={businessDropdownRef}>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] hidden sm:inline">
                  Enterprise:
                </span>
                <button
                  type="button"
                  onClick={() => setBusinessDropdownOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                    activeBusinessId
                      ? "bg-white border-[#18181B] text-[#0F172A]"
                      : "bg-[#F1F5F9] border-[#CBD5E1] text-[#64748B] hover:bg-white hover:text-[#0F172A]"
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${activeBusinessId ? "text-[#18181B]" : "text-[#64748B]"}`} />
                  <span className="max-w-[200px] truncate">
                    {resolvedBusinessName || "Select Active Enterprise..."}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#64748B]" />
                </button>

                {activeBusinessId && (
                  <button
                    type="button"
                    onClick={() => handleSelectBusiness(null)}
                    title="Clear Active Business Selection"
                    className="h-7 w-7 rounded-[8px] hover:bg-[#E2E8F0] text-[#64748B] hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Business Selector Popover Dropdown */}
              {businessDropdownOpen && (
                <div className="absolute left-0 top-10 z-50 w-80 sm:w-96 bg-white rounded-[16px] shadow-2xl border border-[#E2E8F0] p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150 text-[#0F172A]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                    <span className="font-semibold text-xs text-[#0F172A]">
                      Select Enterprise for Scrutiny
                    </span>
                    <span className="text-[10px] font-mono text-[#64748B]">
                      {businessesList.length} Registered
                    </span>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Search name, state, or ID..."
                      value={businessSearchQuery}
                      onChange={(e) => setBusinessSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] focus:outline-hidden focus:border-[#18181B]"
                      autoFocus
                    />
                  </div>

                  {/* Business List */}
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {loadingBusinesses ? (
                      <div className="p-4 text-center text-xs text-[#64748B]">
                        Loading registered enterprises...
                      </div>
                    ) : filteredBusinesses.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#64748B]">
                        No matching enterprises found.
                      </div>
                    ) : (
                      filteredBusinesses.map((b) => {
                        const isSelected = b.id === activeBusinessId;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handleSelectBusiness(b.id)}
                            className={`w-full text-left p-2.5 rounded-[10px] text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? "bg-[#18181B] text-white"
                                : "hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A]"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">{b.name}</div>
                              <div className={`text-[10px] flex items-center gap-1.5 ${isSelected ? "text-slate-300" : "text-[#64748B]"}`}>
                                <span>{b.primary_state || "CENTRAL"}</span>
                                <span>&bull;</span>
                                <span className="truncate">{b.incorporation_type || "MSME"}</span>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. PERSISTENT ASSESSMENT SELECTOR (§6) */}
            {activeBusinessId && (
              <div className="relative flex items-center gap-1.5" ref={assessmentDropdownRef}>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] hidden sm:inline">
                  Assessment:
                </span>
                <button
                  type="button"
                  onClick={() => setAssessmentDropdownOpen((prev) => !prev)}
                  disabled={internalAssessments.length === 0}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                    activeAssessmentId
                      ? "bg-white border-[#18181B] text-[#0F172A]"
                      : "bg-[#F1F5F9] border-[#CBD5E1] text-[#64748B] hover:bg-white hover:text-[#0F172A]"
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${activeAssessmentId ? "text-emerald-600" : "text-[#64748B]"}`} />
                  <span className="max-w-[200px] truncate">
                    {activeAssessmentObj
                      ? `#${activeAssessmentObj.assessment_number} - ${activeAssessmentObj.title}`
                      : internalAssessments.length > 0
                      ? "Select Assessment Run..."
                      : "No Assessments"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#64748B]" />
                </button>

                {/* Assessment Dropdown Popover */}
                {assessmentDropdownOpen && internalAssessments.length > 0 && (
                  <div className="absolute left-0 top-10 z-50 w-72 bg-white rounded-[16px] shadow-2xl border border-[#E2E8F0] p-3 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150 text-[#0F172A]">
                    <div className="pb-1.5 border-b border-[#F1F5F9] text-[11px] font-semibold text-[#64748B]">
                      Evaluation History for this Enterprise
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-1">
                      {internalAssessments.map((a) => {
                        const isSelected = a.id === activeAssessmentId;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => handleSelectAssessment(a.id)}
                            className={`w-full text-left p-2 rounded-[8px] text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? "bg-[#18181B] text-white"
                                : "hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A]"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">
                                #{a.assessment_number} - {a.title}
                              </div>
                              <div className={`text-[10px] flex items-center gap-1.5 ${isSelected ? "text-slate-300" : "text-[#64748B]"}`}>
                                <span className={a.status === "COMPLETED" ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                                  ● {a.status}
                                </span>
                                {a.created_at && (
                                  <span>{new Date(a.created_at).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Engine 2 Status Indicator */}
          <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] shadow-2xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-[#0F172A]">Engine 2 Operational</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#E2E8F0] px-4 py-3 bg-[#FAFAFA] space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-[8px] text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-[#E2E8F0]">
              <Link
                href={activeBusinessId ? `/dashboard?business_id=${activeBusinessId}` : "/dashboard"}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-[8px] text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
              >
                Switch to User Dashboard &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Main Body Canvas */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto min-w-0 bg-[#F4F6F8]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminShell;
