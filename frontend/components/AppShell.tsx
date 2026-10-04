"use client";
import { useState, useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar, { type NavView } from "./Sidebar";
import TopBar from "./TopBar";
import SearchModal from "./SearchModal";
import { useAuth } from "@/context/AuthContext";
import { useBusinessContext } from "@/context/BusinessContext";
import LoadingSkeleton from "./LoadingSkeleton";
import Overlay from "./product/Overlay";
import { ProductMotion } from "./product/ProductMotion";
interface AppShellProps { children?: ReactNode; activeView?: NavView; onSelectView?: (view: NavView) => void; renderViewContent?: (view: NavView) => ReactNode; requireAuth?: boolean }
export function AppShell({ children, activeView: controlledView, onSelectView, renderViewContent, requireAuth = true }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const { activeBusinessId } = useBusinessContext();
  const [view, setView] = useState<NavView>("dashboard");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeView = controlledView || view;
  useEffect(() => {
    if (requireAuth && !loading && !isAuthenticated) router.replace("/auth/signin?redirect=" + encodeURIComponent(pathname || "/dashboard"));
  }, [requireAuth, loading, isAuthenticated, router, pathname]);
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(value => !value); }
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, []);
  function navigate(next: NavView) {
    setMobileOpen(false);
    if (onSelectView) { onSelectView(next); return; }
    setView(next);
    const routes: Partial<Record<NavView,string>> = { updates: "regulatory-updates", assistant: "ai-assistant", profile: "business-profile" };
    const params = activeBusinessId && next !== "settings" ? "?business_id=" + encodeURIComponent(activeBusinessId) : "";
    router.push("/" + (routes[next] || next) + params);
  }
  if (requireAuth && (loading || !isAuthenticated)) return <div className="mx-auto max-w-3xl p-12" role="status" aria-label="Preparing your workspace"><LoadingSkeleton count={3} /></div>;
  const activePill = activeView === "compliance" ? "compliance" : activeView === "updates" ? "reports" : activeView === "dashboard" ? "dashboard" : null;
  return <div className="ui-app">
    <a href="#workspace-content" className="ui-skip">Skip to content</a>
    <TopBar activePill={activePill} onSelectPill={pill => navigate(pill === "reports" ? "updates" : pill)} onNavigateToView={navigate} onToggleMobileMenu={() => setMobileOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
    <div className="ui-app-body">
      <Sidebar activeView={activeView} onSelectView={navigate} />
      <main id="workspace-content" tabIndex={-1} className="ui-canvas"><ProductMotion stateKey={pathname} className="ui-page">{renderViewContent ? renderViewContent(activeView) : children}</ProductMotion></main>
    </div>
    <Overlay open={mobileOpen} onClose={() => setMobileOpen(false)} title="Your workspace" drawer><Sidebar activeView={activeView} onSelectView={navigate} isMobile /></Overlay>
    <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} onNavigateTo={target => { navigate(target as NavView); setSearchOpen(false); }} />
  </div>;
}
export default AppShell;
