"use client";
import { LayoutDashboard, ShieldCheck, FileText, GitFork, Calendar, Bell, Target, Award, Info, Sparkles, FileSpreadsheet, Settings } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
export type NavView = "dashboard" | "compliance" | "documents" | "workflows" | "calendar" | "notifications" | "standards" | "schemes" | "updates" | "assistant" | "profile" | "settings";
interface SidebarProps { activeView: NavView; onSelectView: (view: NavView) => void; isMobile?: boolean }
export default function Sidebar({ activeView, onSelectView }: SidebarProps) {
  const { t } = useLanguage();
  const groups = [
    { title: "Workspace", items: [
      { id: "dashboard", label: "Overview", icon: LayoutDashboard },
      { id: "compliance", label: t("navigation.compliance"), icon: ShieldCheck },
      { id: "documents", label: t("navigation.documents"), icon: FileText },
      { id: "workflows", label: t("navigation.workflows"), icon: GitFork },
      { id: "calendar", label: t("navigation.calendar"), icon: Calendar },
      { id: "notifications", label: "Alerts & notifications", icon: Bell },
    ] },
    { title: "Intelligence", items: [
      { id: "standards", label: t("navigation.standards"), icon: Target },
      { id: "schemes", label: t("navigation.schemes"), icon: Award },
      { id: "updates", label: t("navigation.updates"), icon: Info },
      { id: "assistant", label: t("navigation.assistant"), icon: Sparkles },
    ] },
    { title: "Account", items: [
      { id: "profile", label: "Business profile", icon: FileSpreadsheet },
      { id: "settings", label: t("navigation.settings"), icon: Settings },
    ] },
  ];
  return <aside className="ui-sidebar"><nav aria-label="Workspace navigation" className="ui-sidebar-inner">
    {groups.map(group => <div key={group.title} className="ui-nav-group">
      <p className="ui-nav-label">{group.title}</p>
      {group.items.map(item => <button key={item.id} type="button" className="ui-nav-item" aria-current={activeView === item.id ? "page" : undefined} onClick={() => onSelectView(item.id as NavView)}>
        <item.icon aria-hidden="true" /><span>{item.label}</span>
      </button>)}
    </div>)}
  </nav></aside>;
}
export { Sidebar };
