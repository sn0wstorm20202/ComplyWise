import type { FormEvent } from "react";
import type { ProfileVariableChoice } from "@/types";
import type { DemoPresetDefinition } from "@/data/demo/controlledPresets";
import { useLanguage } from "@/context/LanguageContext";
import Disclosure from "@/components/product/Disclosure";
import DemoPresetSelector from "@/components/onboarding/DemoPresetSelector";

export interface OnboardingProfileFields {
  businessName: string;
  legalConstitution: string;
  registeredState: string;
  district: string;
  industrialZone: string;
  lifecycleStage: string;
  plantInvestmentLakhs: string;
  turnoverLakhs: string;
  employeeCount: string;
}

interface BusinessProfileStepProps {
  fields: OnboardingProfileFields;
  options: {
    legalConstitutionOptions: ProfileVariableChoice[];
    stateOptions: ProfileVariableChoice[];
    industrialZoneOptions: ProfileVariableChoice[];
    lifecycleStageOptions: ProfileVariableChoice[];
  };
  selectedPresetKey: string | null;
  loading: boolean;
  handleProfileSubmit: (event: FormEvent) => void;
  handleSelectPreset: (preset: DemoPresetDefinition) => void;
  onStartOwn: () => void;
  onChange: (field: keyof OnboardingProfileFields, value: string) => void;
}

export default function BusinessProfileStep({ fields, options, selectedPresetKey,
  loading, handleProfileSubmit, handleSelectPreset, onStartOwn, onChange,
}: BusinessProfileStepProps) {
  const { t } = useLanguage();
  const { businessName, legalConstitution, registeredState, district, industrialZone, lifecycleStage, plantInvestmentLakhs, turnoverLakhs, employeeCount } = fields;
  const { legalConstitutionOptions, stateOptions, industrialZoneOptions, lifecycleStageOptions } = options;
  return (
          <div className="space-y-6">
            <form
              onSubmit={handleProfileSubmit}
              className="bg-white rounded-2xl border border-[var(--ui-border)] p-6 sm:p-8 shadow-2xs space-y-6"
            >
            <div className="border-b border-[var(--ui-border)] pb-4">
              <h2 className="text-base font-sans font-bold text-[var(--ui-text)]">
                Start with the basics.
              </h2>
              <p className="text-xs text-[var(--ui-secondary)] mt-1">
                Tell us where you operate and the size of your business. These details help us find the requirements that matter.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                  Legal Enterprise / Operating Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  aria-label="Business name"
                  onChange={(e) => onChange("businessName", e.target.value)}
                  placeholder="e.g. Apex Biotech Formulations LLP"
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2.5 text-sm text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                  Legal Constitution *
                </label>
                <select
                  required
                  value={legalConstitution}
                  aria-label="Legal constitution"
                  onChange={(e) => onChange("legalConstitution", e.target.value)}
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2.5 text-sm text-[var(--ui-text)] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                >
                  <option value="" className="bg-white text-[var(--ui-secondary)]">Select…</option>
                  {legalConstitutionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-[var(--ui-text)]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                  Operating State / Jurisdiction *
                </label>
                <select
                  required
                  value={registeredState}
                  aria-label="Operating state"
                  onChange={(e) => onChange("registeredState", e.target.value)}
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2.5 text-sm text-[var(--ui-text)] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                >
                  <option value="" className="bg-white text-[var(--ui-secondary)]">Select a jurisdiction…</option>
                  {stateOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-[var(--ui-text)]">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--ui-secondary)] mt-1">
                  Choose from the jurisdictions currently supported by ComplyWise.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                  District / Industrial Hub *
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  aria-label="District"
                  onChange={(e) => onChange("district", e.target.value)}
                  placeholder="e.g. Ahmedabad, Pune, Bengaluru"
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2.5 text-sm text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                  Industrial Zone Siting *
                </label>
                <select
                  value={industrialZone}
                  aria-label="Industrial zone"
                  onChange={(e) => onChange("industrialZone", e.target.value)}
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2.5 text-sm text-[var(--ui-text)] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                >
                  <option value="" className="bg-white text-[var(--ui-secondary)]">Not specified</option>
                  {industrialZoneOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-[var(--ui-text)]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                  Enterprise Lifecycle Stage *
                </label>
                <select
                  required
                  value={lifecycleStage}
                  aria-label="Lifecycle stage"
                  onChange={(e) => onChange("lifecycleStage", e.target.value)}
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2.5 text-sm text-[var(--ui-text)] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                >
                  <option value="" className="bg-white text-[var(--ui-secondary)]">Select…</option>
                  {lifecycleStageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-[var(--ui-text)]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
              <Disclosure title="Additional business details · optional">
              <p className="text-xs text-[var(--ui-secondary)] mb-4">Add these figures if you know them. You can leave them blank and answer later if they affect a requirement.</p>
              <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                  Plant &amp; Machinery Investment (₹ Lakhs)
                </label>
                <input
                  type="number"
                  min="0"
                  value={plantInvestmentLakhs}
                  aria-label="Plant and machinery investment"
                  onChange={(e) => onChange("plantInvestmentLakhs", e.target.value)}
                  placeholder="Leave blank if not known"
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2.5 text-sm text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                  Estimated / Actual Annual Turnover (₹ Lakhs)
                </label>
                <input
                  type="number"
                  min="0"
                  value={turnoverLakhs}
                  aria-label="Annual turnover"
                  onChange={(e) => onChange("turnoverLakhs", e.target.value)}
                  placeholder="Leave blank if not known"
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2.5 text-sm text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                  Direct Employees &amp; Workers (Count)
                </label>
                <input
                  type="number"
                  min="0"
                  value={employeeCount}
                  aria-label="Workers"
                  onChange={(e) => onChange("employeeCount", e.target.value)}
                  placeholder="Leave blank if not known"
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2.5 text-sm text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
              </div>
              </Disclosure>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--ui-border)]">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-text)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ui-text)] disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              >
                {loading ? t("onboarding.savingProfile") : t("onboarding.continueToProducts")}
              </button>
            </div>
          </form>
          <section aria-label="Optional starting profiles" className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--ui-text)]">Need a head start? Use a starter profile</h2>
            <DemoPresetSelector selectedKey={selectedPresetKey} onSelectPreset={handleSelectPreset} onStartOwn={onStartOwn} />
          </section>
          </div>
  );
}
