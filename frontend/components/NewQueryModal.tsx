"use client";

import React, { useState } from "react";
import { X, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, CornerDownLeft, Sparkles, Layers } from "lucide-react";

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

  function handleReset() {
    setResult(null);
    setProductText("");
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-950 text-sm">
                New BIS Compliance Query
              </span>
              <span className="bg-blue-50 text-blue-900 font-semibold px-2 py-0.5 rounded text-[10px] border border-blue-200">
                Deterministic Evaluator
              </span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Evaluate product specifications or components against published Quality Control Orders.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 text-xs">
                  Product Description or Component Name
                </label>
                <input
                  type="text"
                  value={productText}
                  onChange={(e) => setProductText(e.target.value)}
                  placeholder="e.g., 16A 3-Pin Molded Plug with Earth Pin, or AC/DC LED Driver"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 text-xs">
                    Regulatory Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-blue-900 focus:outline-none"
                  >
                    <option>Electrical Accessories</option>
                    <option>Household Appliances</option>
                    <option>IT & Electronics (CRS)</option>
                    <option>Industrial Equipment</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 text-xs">
                    Manufacturing Origin
                  </label>
                  <select className="w-full rounded-lg border border-slate-300 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-blue-900 focus:outline-none">
                    <option>Domestic Production (India)</option>
                    <option>Imported Finished Product</option>
                    <option>Component for Assembly</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-700">Quick Test Suggestions:</div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {["16A Re-wireable Plug", "LED Controlgear 45W", "Electric Immersion Heater"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setProductText(s)}
                      className="bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEvaluating || !productText.trim()}
                  className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white font-semibold disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                >
                  {isEvaluating ? "Evaluating Mandates..." : "Run Compliance Check"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-bold text-emerald-950 text-xs">
                      Evaluation Result: Mandatory Compliance Identified
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    MATCH CONFIRMED
                  </span>
                </div>

                <div className="pt-1">
                  <div className="font-mono text-sm font-bold text-slate-950">
                    {result.standardCode}
                  </div>
                  <div className="text-slate-700 text-xs font-medium mt-0.5">
                    {result.standardTitle}
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 leading-relaxed pt-1">
                  {result.reason}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">
                    Enforcing QCO Order
                  </div>
                  <div className="font-medium text-slate-900 mt-0.5">
                    {result.qcoNotice}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">
                    Applicable Scope
                  </div>
                  <div className="font-medium text-slate-900 mt-0.5">
                    {result.applicableClauses} Mandatory Testing Clauses
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-slate-500 hover:text-slate-900 font-medium"
                >
                  ← Test Another Product
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
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
                      className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white font-semibold"
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
    </div>
  );
}

export default NewQueryModal;
