"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ErrorState from "@/components/ErrorState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useBusinessContext } from "@/context/BusinessContext";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import type { NotificationPreferenceResponse } from "@/lib/api/calendar";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
export default function SettingsPage() {
  const { user } = useAuth();
  const { activeBusinessId, profile } = useBusinessContext();
  const { language, setLanguage } = useLanguage();
  const [preferences, setPreferences] = useState<NotificationPreferenceResponse | null>(null);
  const [baseline, setBaseline] = useState("");
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState<string | null>(null);
  const [saved,setSaved] = useState(false);
  const [loadAttempt,setLoadAttempt] = useState(0);
  useEffect(() => {
    if (!activeBusinessId) { setPreferences(null); return; }
    let active = true;
    setLoading(true);
    setError(null);
    setPreferences(null);
    api.calendar.getPreferences(activeBusinessId).then(value => { if(active) { setPreferences(value); setBaseline(JSON.stringify(value)); } }).catch(() => { if(active) setError("We couldn't load your notification preferences."); }).finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  },[activeBusinessId,loadAttempt]);
  const dirty = Boolean(preferences && JSON.stringify(preferences) !== baseline);
  async function save() {
    if (!preferences || !activeBusinessId) return;
    setSaving(true); setError(null); setSaved(false);
    try { const result = await api.calendar.updatePreferences(activeBusinessId, preferences); setPreferences(result); setBaseline(JSON.stringify(result)); setSaved(true); }
    catch { setError("Your preferences weren't saved. Please try again."); }
    finally { setSaving(false); }
  }
  return <AppShell activeView="settings"><div className="max-w-4xl space-y-8">
    <header><p className="ui-eyebrow mb-3">Account</p><h1 className="text-3xl">Settings</h1><p className="text-sm text-[var(--ui-secondary)] mt-3">Make your workspace work for you.</p></header>
    {error && <ErrorState title={error} message="Your current choices are preserved." onRetry={() => { if(dirty) void save(); else setLoadAttempt(value => value + 1); }} />}
    <section className="border-b border-[var(--ui-border)] pb-8"><h2 className="font-semibold mb-5">Your account</h2><div className="grid gap-6 sm:grid-cols-2"><div><p className="ui-eyebrow">Name</p><p className="mt-1">{user?.full_name || "Not provided"}</p></div><div><p className="ui-eyebrow">Email</p><p className="mt-1 break-all">{user?.email}</p></div></div></section>
    <section className="border-b border-[var(--ui-border)] pb-8"><div className="flex justify-between gap-4"><div><h2 className="font-semibold">Business context</h2><p className="text-sm text-[var(--ui-secondary)] mt-2">{activeBusinessId ? profile.businessName : "No business selected"}</p></div><Link href="/business-profile" className="ui-button">Manage business<ArrowRight size={16} /></Link></div></section>
    <section className="border-b border-[var(--ui-border)] pb-8"><h2 className="font-semibold mb-2">Notifications</h2><p className="text-sm text-[var(--ui-secondary)] mb-6">Choose where this business receives deadline reminders.</p>
      {loading ? <LoadingSkeleton count={2} /> : !preferences ? <p className="text-sm text-[var(--ui-secondary)]">Select a business to configure its notifications.</p> : <div className="divide-y divide-[var(--ui-border)]">
        {([{key:"email_enabled",title:"Email",description:"Receive reminders in your inbox."},{key:"in_app_enabled",title:"In-app alerts",description:"Keep reminders in your workspace."},{key:"calendar_enabled",title:"Calendar",description:"Enable reminders for your connected calendar."}] as const).map(item => <label key={item.key} className="flex items-center justify-between gap-4 py-4 cursor-pointer"><span><span className="font-medium block">{item.title}</span><span className="text-xs text-[var(--ui-secondary)]">{item.description}</span></span><input type="checkbox" className="h-5 w-5" disabled={saving} checked={preferences[item.key]} onChange={event => { setSaved(false); setPreferences({...preferences,[item.key]:event.target.checked}); }} /></label>)}
        <label className="flex items-center justify-between gap-4 py-4"><span className="font-medium">Reminder language</span><select aria-label="Reminder language" className="border border-[var(--ui-border)] rounded-lg px-3 py-2 bg-white" value={preferences.language} disabled={saving} onChange={event => setPreferences({...preferences,language:event.target.value as NotificationPreferenceResponse["language"]})}><option value="en">English</option><option value="hi">हिन्दी</option><option value="bn">বাংলা</option></select></label>
      </div>}
    </section>
    <section className="border-b border-[var(--ui-border)] pb-8"><label className="flex items-center justify-between gap-4"><span><span className="font-semibold block">Workspace language</span><span className="text-xs text-[var(--ui-secondary)]">Applied immediately on this device.</span></span><select aria-label="Workspace language" value={language} onChange={event => setLanguage(event.target.value as typeof language)} className="rounded-lg border border-[var(--ui-border)] bg-white px-3 py-2"><option value="en">English</option><option value="hi">हिन्दी</option><option value="bn">বাংলা</option></select></label></section>
    <section className="flex items-start gap-3"><ShieldCheck size={20} className="text-[var(--ui-sage)] shrink-0" /><div><h2 className="font-semibold">Rule-governed decisions</h2><p className="text-xs text-[var(--ui-secondary)] mt-2">Applicability follows published rules. Explanation settings cannot change a regulatory decision.</p></div></section>
    <div className={`ui-object flex items-center justify-between gap-4 ${dirty ? "sticky bottom-4" : ""}`}><p role="status" className="text-sm text-[var(--ui-secondary)]">{saved ? <span className="flex gap-2 text-[var(--ui-sage)]"><Check size={16} />Preferences saved</span> : dirty ? "You have unsaved changes." : preferences ? "Your preferences are up to date." : "Select a business to manage preferences."}</p><button type="button" className="ui-button ui-button-primary" disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</button></div>
  </div></AppShell>;
}
