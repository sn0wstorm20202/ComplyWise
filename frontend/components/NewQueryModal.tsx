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
    <div className="fixed inset-0 z-50 bg-[#08080a]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#121317] rounded-[10px] shadow-2xl border border-[#1c1d22] overflow-hidden animate-in zoom-in-95 duration-150 text-xs text-[#e2e3e9]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c1d22]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#ffffff] text-sm">
                New BIS Compliance Query
              </span>
              <span className="bg-[#1c1d22] text-[#cc9166] font-semibold px-2 py-0.5 rounded-full text-[10px] border border-[#cc9166]/30">
                Deterministic Evaluator
              </span>
            </div>
            <p className="text-[#9194a1] text-[11px] mt-0.5">
              Evaluate product specifications or components against published Quality Control Orders.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#777a88] hover:text-[#ffffff] rounded-[4px] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-medium text-[#e2e3e9] text-xs">
                  Product Description or Component Name
                </label>
                <input
                  type="text"
                  value={productText}
                  onChange={(e) => setProductText(e.target.value)}
                  placeholder="e.g., 16A 3-Pin Molded Plug with Earth Pin, or AC/DC LED Driver"
                  className="w-full rounded-[10px] border border-[#1c1d22] bg-[#040406] px-3.5 py-2.5 text-xs text-[#ffffff] placeholder:text-[#5e616e] focus:border-[#cc9166] focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-[#e2e3e9] text-xs">
                    Regulatory Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-[10px] border border-[#1c1d22] bg-[#040406] px-3 py-2 text-xs text-[#ffffff] focus:border-[#cc9166] focus:outline-none cursor-pointer"
                  >
                    <option className="bg-[#121317]">Electrical Accessories</option>
                    <option className="bg-[#121317]">Household Appliances</option>
                    <option className="bg-[#121317]">IT & Electronics (CRS)</option>
                    <option className="bg-[#121317]">Industrial Equipment</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-[#e2e3e9] text-xs">
                    Manufacturing Origin
                  </label>
                  <select className="w-full rounded-[10px] border border-[#1c1d22] bg-[#040406] px-3 py-2 text-xs text-[#ffffff] focus:border-[#cc9166] focus:outline-none cursor-pointer">
                    <option className="bg-[#121317]">Domestic Production (India)</option>
                    <option className="bg-[#121317]">Imported Finished Product</option>
                    <option className="bg-[#121317]">Component for Assembly</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-[10px] bg-[#040406] border border-[#1c1d22] text-[11px] text-[#9194a1] space-y-1.5">
                <div className="font-semibold text-[#e2e3e9]">Quick Test Suggestions:</div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {["16A Re-wireable Plug", "LED Controlgear 45W", "Electric Immersion Heater"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setProductText(s)}
                      className="bg-[#121317] hover:bg-[#1c1d22] border border-[#2e3038] px-2.5 py-1 rounded-full text-[11px] text-[#e2e3e9] transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1c1d22]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full border border-[#2e3038] text-[#9194a1] hover:text-[#ffffff] hover:bg-white/[0.03] font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEvaluating || !productText.trim()}
                  className="px-5 py-2 rounded-full bg-[#ffffff] hover:bg-white/90 text-[#000000] font-medium disabled:opacity-40 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {isEvaluating ? "Evaluating Mandates..." : "Run Compliance Check"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-[10px] border border-[#1c1d22] bg-[#040406] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#75d69c]" />
                    <span className="font-bold text-[#ffffff] text-xs">
                      Evaluation Result: Mandatory Compliance Identified
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-[#75d69c]/10 text-[#75d69c] border border-[#75d69c]/20 font-bold px-2 py-0.5 rounded-full">
                    MATCH CONFIRMED
                  </span>
                </div>

                <div className="pt-1">
                  <div className="font-mono text-sm font-bold text-[#cc9166]">
                    {result.standardCode}
                  </div>
                  <div className="text-[#ffffff] text-xs font-medium mt-0.5">
                    {result.standardTitle}
                  </div>
                </div>

                <div className="text-[11px] text-[#9194a1] leading-relaxed pt-1">
                  {result.reason}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-[10px] bg-[#040406] border border-[#1c1d22]">
                  <div className="text-[#777a88] font-semibold uppercase text-[10px]">
                    Enforcing QCO Order
                  </div>
                  <div className="font-medium text-[#e2e3e9] mt-0.5">
                    {result.qcoNotice}
                  </div>
                </div>

                <div className="p-3 rounded-[10px] bg-[#040406] border border-[#1c1d22]">
                  <div className="text-[#777a88] font-semibold uppercase text-[10px]">
                    Applicable Scope
                  </div>
                  <div className="font-medium text-[#e2e3e9] mt-0.5">
                    {result.applicableClauses} Mandatory Testing Clauses
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1c1d22]">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="text-[#9194a1] hover:text-[#ffffff] font-medium cursor-pointer transition-colors"
                >
                  ← Test Another Product
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-full border border-[#2e3038] text-[#9194a1] hover:text-[#ffffff] hover:bg-white/[0.03] font-medium cursor-pointer transition-colors"
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
                      className="px-5 py-2 rounded-full bg-[#ffffff] hover:bg-white/90 text-[#000000] font-medium transition-colors cursor-pointer"
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
