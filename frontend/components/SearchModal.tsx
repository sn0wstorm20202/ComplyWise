"use client";
import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import Overlay from "./product/Overlay";
interface SearchModalProps { isOpen: boolean; onClose: () => void; onNavigateTo?: (view: string) => void }
const destinations = [
  ["dashboard", "Overview", "Business status and priority actions"],
  ["compliance", "Compliance", "Requirements, applicability and evidence"],
  ["documents", "Documents", "Upload and review business documents"],
  ["workflows", "Workflows", "Manage your next steps"],
  ["calendar", "Calendar", "Deadlines and reminders"],
  ["notifications", "Alerts & notifications", "Changes that need your attention"],
  ["standards", "Standards", "Search standards and source clauses"],
  ["schemes", "Schemes", "Matched benefits and eligibility"],
  ["updates", "Regulatory updates", "Changes and their effective dates"],
  ["assistant", "BIS Copilot", "Ask a source-grounded question"],
  ["profile", "Business profile", "Business context and assessments"],
  ["settings", "Settings", "Workspace preferences"],
];
export default function SearchModal({ isOpen, onClose, onNavigateTo }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const results = destinations.filter(item => item.join(" ").toLowerCase().includes(query.toLowerCase()));
  return <Overlay open={isOpen} onClose={onClose} title="Find your workspace">
    <label className="flex items-center gap-3 rounded-xl border border-[var(--ui-border)] p-3"><Search size={18} aria-hidden="true" /><input autoFocus aria-label="Search workspace destinations" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find compliance, documents, standards…" className="w-full bg-transparent outline-none" /></label>
    <p className="ui-eyebrow mt-6 mb-2">Go to</p>
    <div className="space-y-1">{results.map(([id,title,description]) => <button key={id} type="button" className="flex w-full items-center gap-4 rounded-xl p-3 text-left hover:bg-[var(--ui-hover)]" onClick={() => { onNavigateTo?.(id); onClose(); }}><div className="flex-1"><p className="font-medium">{title}</p><p className="text-xs text-[var(--ui-secondary)]">{description}</p></div><ArrowRight size={16} /></button>)}{!results.length && <p className="ui-empty">No workspace sections match “{query}”. Try another term.</p>}</div>
  </Overlay>;
}
export { SearchModal };
