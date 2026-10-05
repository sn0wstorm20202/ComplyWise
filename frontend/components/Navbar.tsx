"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import ComplyWiseLogo from "./icons/ComplyWiseLogo";
import Overlay from "./product/Overlay";

export function Navbar({ variant = "default" }: { variant?: "default" | "onboarding" } = {}) {
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const destinations = [["/dashboard","Overview"],["/business-profile","Business profile"],["/onboarding?new=true","New assessment"],["/compliance","Compliance"],["/documents","Documents"],["/workflows","Workflows"],["/calendar","Calendar"],["/standards","Standards"],["/schemes","Schemes"],["/assistant","BIS Copilot"]];
  async function signOut() { await logout(); router.push("/auth/signin"); }
  return <header className="ui-topbar">
    <Link href={isAuthenticated ? "/dashboard" : "/"} aria-label="ComplyWise"><ComplyWiseLogo showSubtitle={false} /></Link>
    {variant !== "onboarding" && isAuthenticated && <nav aria-label="Product navigation" className="hidden xl:flex gap-6 text-sm"><Link href="/dashboard">Overview</Link><Link href="/business-profile">Businesses</Link><Link href="/onboarding?new=true">New assessment</Link></nav>}
    <div className="flex items-center gap-1 sm:gap-3">
      <LanguageSelector compact />
      {isAuthenticated ? <>
        {variant !== "onboarding" && <button className="ui-icon-button xl:hidden" onClick={() => setOpen(true)} aria-label="Open product navigation"><Menu size={18} /></button>}
        {(user?.is_staff || user?.is_superuser) && <Link href="/admin" className="ui-nav-review-link ui-button">Review workspace</Link>}
        <Link href="/business-profile" className={`ui-icon-button ${variant === "default" ? "ui-nav-profile-default" : ""}`} aria-label="My profile"><User size={18} /></Link>
        <button className="ui-icon-button" onClick={signOut} aria-label={t("navigation.signOut")}><LogOut size={18} /></button>
      </> : <Link href="/auth/signin" className="ui-button">Sign in</Link>}
    </div>
    <Overlay open={open} onClose={() => setOpen(false)} title="Product navigation" drawer><nav className="grid gap-1">{destinations.map(([href,label]) => <Link className="ui-nav-item" key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav></Overlay>
  </header>;
}
export default Navbar;
