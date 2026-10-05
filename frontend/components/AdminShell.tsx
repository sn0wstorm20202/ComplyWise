"use client";
import { Suspense, useEffect, useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types";
import { ArrowRightLeft, LogOut, Menu, Shield } from "lucide-react";
import Overlay from "./product/Overlay";
import LoadingSkeleton from "./LoadingSkeleton";
import { ProductMotion } from "./product/ProductMotion";
interface AdminShellProps { children: ReactNode; activeTab?: "dashboard" | "queue" | "cases" | "businesses" }
export function AdminShell(props: AdminShellProps) {
  return (
    <Suspense fallback={<div className="p-12 max-w-4xl mx-auto" role="status" aria-label="Loading review workspace"><LoadingSkeleton count={3} /></div>}>
      <AdminShellContent {...props} />
    </Suspense>
  );
}

function AdminShellContent({ children }: AdminShellProps) {
  const router = useRouter(), pathname = usePathname();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const [currentUser,setCurrentUser] = useState<User | null>(null);
  const [mobileOpen,setMobileOpen] = useState(false);
  const check = useCallback(async () => {
    try { const user = await api.auth.me(); if (!user.is_compliance_officer && !user.is_staff && !user.is_superuser) { router.replace("/admin/login?error=unauthorized"); return; } setCurrentUser(user); }
    catch { router.replace("/admin/login"); }
  },[router]);
  useEffect(() => { void check(); },[check]);
  async function signOut() { await logout(); router.replace("/admin/login"); }
  if (!currentUser) return <div className="p-12 max-w-4xl mx-auto" role="status" aria-label="Checking review access"><LoadingSkeleton count={3} /></div>;
  const queue = pathname === "/admin/cases" && searchParams.get("status") === "HUMAN_REVIEW";
  const links = [
    { label:"Compliance review",href:"/admin",active:pathname === "/admin" },
    { label:"Review queue",href:"/admin/cases?status=HUMAN_REVIEW",active:queue },
    { label:"All cases",href:"/admin/cases",active:pathname.startsWith("/admin/cases") && !queue },
    { label:"Knowledge",href:"/admin/knowledge",active:pathname.startsWith("/admin/knowledge") },
    { label:"Businesses",href:"/admin/businesses",active:pathname.startsWith("/admin/businesses") },
  ];
  return <div className="ui-admin min-h-screen flex flex-col">
    <a href="#review-content" className="ui-skip">Skip to review</a>
    <header className="ui-topbar">
      <div className="flex items-center gap-3"><button className="ui-icon-button lg:hidden" aria-label="Open review navigation" onClick={() => setMobileOpen(true)}><Menu size={18} /></button><Link href="/admin" className="flex items-center gap-3"><Shield size={22} className="text-[var(--ui-sage)]" /><div><span className="font-semibold">ComplyWise</span><p className="ui-eyebrow">Compliance review</p></div></Link></div>
      <nav aria-label="Review navigation" className="hidden lg:flex items-center gap-1">{links.map(item => <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} className={"ui-button !border-0 !text-xs " + (item.active ? "!bg-[var(--ui-sage-soft)] !text-[var(--ui-sage)]" : "!bg-transparent")}>{item.label}</Link>)}</nav>
      <div className="flex items-center gap-2"><span className="hidden xl:block text-xs text-[var(--ui-secondary)]">{currentUser.full_name || currentUser.email}</span><Link href="/dashboard" className="ui-icon-button" aria-label="Open business workspace"><ArrowRightLeft size={18} /></Link><button className="ui-icon-button" onClick={signOut} aria-label="Sign out of review workspace"><LogOut size={18} /></button></div>
    </header>
    <main id="review-content" tabIndex={-1} className="flex-1"><ProductMotion stateKey={pathname}>{children}</ProductMotion></main>
    <Overlay open={mobileOpen} onClose={() => setMobileOpen(false)} title="Review navigation" drawer><nav>{links.map(item => <Link className="ui-nav-item" key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} onClick={() => setMobileOpen(false)}>{item.label}</Link>)}</nav></Overlay>
  </div>;
}
export default AdminShell;
