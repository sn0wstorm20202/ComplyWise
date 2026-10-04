"use client";

import { useState, type FormEvent } from "react";
import DemoPresetSelector from "@/components/onboarding/DemoPresetSelector";
import Overlay from "./Overlay";
import { request } from "@/lib/api/client";
import type { DemoPresetDefinition } from "@/data/demo/controlledPresets";

const empty = { name: "", description: "", state: "", district: "", constitution: "PROPRIETORSHIP", employees: "", turnover: "", investment: "" };

export default function AdminBusinessCreation({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [email, setEmail] = useState("");
  const [createUser, setCreateUser] = useState(false);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function select(p: DemoPresetDefinition) {
    setSelected(p.presetKey);
    setForm({ name: p.businessName, description: p.productDescription || p.tagline, state: p.state.toUpperCase().replaceAll(" ", "_"), district: p.district, constitution: "PROPRIETORSHIP", employees: String(p.employeeCount), turnover: String(p.annualTurnoverLakhs), investment: String(p.plantInvestmentLakhs) });
  }
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const variables: Record<string, { value: string | number; origin: string }> = {};
    const put = (key: string, value: string | number) => { if (value !== "") variables[key] = { value, origin: "USER_PROVIDED" }; };
    put("state", form.state); put("district", form.district); put("legal_constitution", form.constitution);
    put("product_description", form.description); put("lifecycle_stage", "OPERATIONAL");
    if (form.employees !== "") put("total_worker_count", Number(form.employees));
    if (form.turnover !== "") put("annual_turnover", Math.round(Number(form.turnover) * 100000));
    if (form.investment !== "") put("plant_machinery_investment", Math.round(Number(form.investment) * 100000));
    try {
      await request("/admin/businesses/create", { method: "POST", body: JSON.stringify({ name: form.name, owner_email: email, profile: { variables }, ...(createUser ? { new_user: { email, password, full_name: fullName } } : {}) }) });
      setPassword(""); setOpen(false); onCreated();
    } catch (err) { setError(err instanceof Error ? err.message : "Business could not be saved. Your entries are retained."); }
    finally { setBusy(false); }
  }
  return <>
    <button className="ui-button ui-button-primary" onClick={() => setOpen(true)}>Create business</button>
    <Overlay open={open} onClose={() => { if (!busy) setOpen(false); }} title="Create business" wide initialFocusSelector="[aria-pressed]">
      <DemoPresetSelector selectedKey={selected} onSelectPreset={select} onStartOwn={() => { setSelected(null); setForm(empty); }} />
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {([['name', 'Business name'], ['state', 'Operating state code'], ['district', 'District'], ['employees', 'Workers'], ['turnover', 'Annual turnover (lakhs INR)'], ['investment', 'Plant investment (lakhs INR)']] as const).map(([key, label]) => <label key={key} className="block text-sm">{label}<input className="ui-input mt-1 w-full" type={['employees','turnover','investment'].includes(key) ? 'number' : 'text'} min={0} step={key === 'employees' ? 1 : 'any'} required={key === 'name' || key === 'state'} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}
          <label className="block text-sm">Legal constitution<select className="ui-input mt-1 w-full" value={form.constitution} onChange={e => setForm({ ...form, constitution: e.target.value })}>{['PROPRIETORSHIP','PARTNERSHIP','LLP','PRIVATE_LIMITED','PUBLIC_LIMITED'].map(x => <option key={x}>{x}</option>)}</select></label>
        </div>
        <label className="block text-sm">Business description<textarea className="ui-input mt-1 w-full" rows={3} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <label className="block text-sm">Owner email<input type="email" autoComplete="off" className="ui-input mt-1 w-full" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={createUser} onChange={e => setCreateUser(e.target.checked)} />Create a new user account</label>
        {createUser && <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Owner name<input className="ui-input mt-1 w-full" value={fullName} onChange={e => setFullName(e.target.value)} /></label><label className="block text-sm">Initial password<input type="password" autoComplete="new-password" className="ui-input mt-1 w-full" required value={password} onChange={e => setPassword(e.target.value)} /></label></div>}
        {error && <p role="alert" className="text-sm text-[var(--ui-danger)]">{error}</p>}
        <p className="text-xs text-[var(--ui-secondary)]">This saves an editable profile. Assessment and adaptive questions run through the normal product flow.</p>
        <button disabled={busy} className="ui-button ui-button-primary" type="submit">{busy ? "Saving business…" : "Save business"}</button>
      </form>
    </Overlay>
  </>;
}
