"use client";
import Overlay from "@/components/product/Overlay";

import React, { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";

interface NewQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewStandard?: (code: string) => void;
}

export function NewQueryModal({ isOpen, onClose, onViewStandard }: NewQueryModalProps) {
  const [productText, setProductText] = useState("");
  const [category, setCategory] = useState("Electrical Accessories");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<{
    standardCode: string;
    standardTitle: string;
    isMandatory: boolean;
    qcoNotice: string;
    applicableClauses: number;
    authority: string;
    status: string;
    reason: string;
  } | null>(null);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productText.trim()) return;

    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
      // Deterministic simulation based on query
      if (productText.toLowerCase().includes("led") || productText.toLowerCase().includes("lamp")) {
        setResult({
          standardCode: "IS 15885 (Part 2/Sec 13)",
          standardTitle: "Lamp Controlgear: Particular Requirements for Electronic Controlgear for LED Modules",
          isMandatory: true,
          qcoNotice: "LED Products (Quality Control) Order 2022",
          applicableClauses: 11,
          authority: "Ministry of Power / BIS",
          status: "MANDATORY_REGISTRATION",
          reason: "MeitY Compulsory Registration Scheme (CRS) applies. Product requires testing under Clause 12 and Clause 14.",
        });
      } else if (productText.toLowerCase().includes("kettle") || productText.toLowerCase().includes("appliance")) {
        setResult({
          standardCode: "IS 302-1:2024",
          standardTitle: "Safety of Household and Similar Electrical Appliances: General Requirements",
          isMandatory: true,
          qcoNotice: "Electrical Appliances (Quality Control) Order 2023",
          applicableClauses: 24,
          authority: "Bureau of Indian Standards",
          status: "MANDATORY_ISI_MARK",
          reason: "Mandatory Scheme I license required before domestic sale. Factory audit and in-house testing lab verification mandated.",
        });
      } else {
        setResult({
          standardCode: "IS 1293:2019",
          standardTitle: "Plugs and socket-outlets of rated voltage up to and including 250 V",
          isMandatory: true,
          qcoNotice: "Electrical Accessories (QCO) Order 2024, S.O. 1421(E)",
          applicableClauses: 18,
          authority: "DPIIT / BIS",
          status: "MANDATORY_ISI_MARK",
          reason: "Applies to 3-pin and 2-pin domestic/industrial plugs. Endurance (Cl. 13.2) and Temperature Rise (Cl. 18) testing required.",
        });
      }
    }, 400);
  }

  return (
    <Overlay open onClose={() => onClose()} title="Details">
      <div
        className="w-full max-w-xl bg-white rounded-[16px] shadow-2xl border border-[var(--ui-border)] overflow-hidden animate-in zoom-in-95 duration-150 text-xs text-[var(--ui-text)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--ui-border)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--ui-text)] text-sm">
                New BIS Compliance Query
              </span>
              <span className="bg-[var(--ui-inset)] text-[var(--ui-text)] font-semibold px-2 py-0.5 rounded-full text-[10px] border border-[var(--ui-border)]">
                Deterministic Evaluator
              </span>
            </div>
            <p className="text-[var(--ui-secondary)] text-[11px] mt-0.5">
              Evaluate product specifications or components against published Quality Control Orders.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ui-secondary)] hover:text-[var(--ui-text)] rounded-[6px] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-medium text-[var(--ui-text)] text-xs">
                  Product Description or Component Name
                </label>
                <input
                  type="text"
                  value={productText}
                  onChange={(e) => setProductText(e.target.value)}
                  placeholder="e.g., 16A 3-Pin Molded Plug with Earth Pin, or AC/DC LED Driver"
                  className="w-full rounded-[10px] border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2.5 text-xs text-[var(--ui-text)] placeholder:text-[var(--ui-muted)] focus:border-[var(--ui-text)] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-[var(--ui-text)] text-xs">
                    Regulatory Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-[10px] border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-2 text-xs text-[var(--ui-text)] focus:border-[var(--ui-text)] focus:outline-hidden cursor-pointer"
                  >
                    <option>Electrical Accessories</option>
                    <option>Household Appliances</option>
                    <option>IT & Electronics (CRS)</option>
                    <option>Industrial Equipment</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-[var(--ui-text)] text-xs">
                    Manufacturing Origin
                  </label>
                  <select className="w-full rounded-[10px] border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-2 text-xs text-[var(--ui-text)] focus:border-[var(--ui-text)] focus:outline-hidden cursor-pointer">
                    <option>Domestic Production (India)</option>
                    <option>Imported Finished Product</option>
                    <option>Component for Assembly</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-[10px] bg-[var(--ui-bg)] border border-[var(--ui-border)] text-[11px] text-[var(--ui-secondary)] space-y-1.5">
                <div className="font-semibold text-[var(--ui-text)]">Quick Test Suggestions:</div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {["16A Re-wireable Plug", "LED Controlgear 45W", "Electric Immersion Heater"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setProductText(s)}
                      className="bg-white hover:bg-[var(--ui-inset)] border border-[var(--ui-border)] px-2.5 py-1 rounded-full text-[11px] text-[var(--ui-text)] transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--ui-border)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full border border-[var(--ui-border)] text-[var(--ui-secondary)] hover:text-[var(--ui-text)] hover:bg-[var(--ui-inset)] font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEvaluating || !productText.trim()}
                  className="px-5 py-2 rounded-full bg-[var(--ui-text)] hover:bg-[var(--ui-text)] text-white font-medium disabled:opacity-40 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {isEvaluating ? "Evaluating Mandates..." : "Run Compliance Check"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-[10px] border border-[var(--ui-border)] bg-[var(--ui-bg)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--ui-sage)]" />
                    <span className="font-bold text-[var(--ui-text)] text-xs">
                      Evaluation Result: Mandatory Compliance Identified
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)] font-bold px-2 py-0.5 rounded-full">
                    MATCH CONFIRMED
                  </span>
                </div>

                <div className="pt-1">
                  <div className="font-mono text-sm font-bold text-[var(--ui-text)]">
                    {result.standardCode}
                  </div>
                  <div className="text-[var(--ui-text)] text-xs font-medium mt-0.5">
                    {result.standardTitle}
                  </div>
                </div>

                <div className="text-[11px] text-[var(--ui-secondary)] leading-relaxed pt-1">
                  {result.reason}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-[10px] bg-[var(--ui-bg)] border border-[var(--ui-border)]">
                  <div className="text-[var(--ui-secondary)] font-semibold uppercase text-[10px]">
                    Enforcing QCO Order
                  </div>
                  <div className="font-medium text-[var(--ui-text)] mt-0.5">
                    {result.qcoNotice}
                  </div>
                </div>

                <div className="p-3 rounded-[10px] bg-[var(--ui-bg)] border border-[var(--ui-border)]">
                  <div className="text-[var(--ui-secondary)] font-semibold uppercase text-[10px]">
                    Applicable Scope
                  </div>
                  <div className="font-medium text-[var(--ui-text)] mt-0.5">
                    {result.applicableClauses} Mandatory Testing Clauses
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--ui-border)]">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="text-[var(--ui-secondary)] hover:text-[var(--ui-text)] font-medium cursor-pointer transition-colors"
                >
                  ← Test Another Product
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-full border border-[var(--ui-border)] text-[var(--ui-secondary)] hover:text-[var(--ui-text)] hover:bg-[var(--ui-inset)] font-medium cursor-pointer transition-colors"
                  >
                    Done
                  </button>
                  {onViewStandard && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onViewStandard(result.standardCode);
                      }}
                      className="px-5 py-2 rounded-full bg-[var(--ui-text)] hover:bg-[var(--ui-text)] text-white font-medium transition-colors cursor-pointer"
                    >
                      Inspect Standard Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
}

export default NewQueryModal;
