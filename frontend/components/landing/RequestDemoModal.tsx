"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Building2, Mail, User, Phone, ArrowRight } from "lucide-react";

interface RequestDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestDemoModal({ isOpen, onClose }: RequestDemoModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    sector: "Electrical Appliances & Equipment",
  });

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  function handleReset() {
    setSubmitted(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#0F172A] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              CW
            </div>
            <div>
              <div className="text-sm font-bold text-[#0F172A] font-sans">Request Product Demo</div>
              <div className="text-[11px] text-[#64748B]">ComplyWise BIS Compliance Intelligence</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <p className="text-[#64748B] text-xs leading-relaxed">
                Connect with our compliance solutions team to review your manufacturing scope, applicable BIS Quality Control Orders (QCOs), and testing parameters.
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#0F172A]">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Dr. Vikramaditya Sharma"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-3 py-2 text-xs text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#0F172A]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#0F172A]">Corporate Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@enterprise.com"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-3 py-2 text-xs text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#0F172A]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#0F172A]">Enterprise / Organization Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Apex Industrial Electro-Mechanicals Ltd."
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-3 py-2 text-xs text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#0F172A]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#0F172A]">Primary Manufacturing Category</label>
                <select
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-hidden cursor-pointer"
                >
                  <option>Electrical Accessories & Plugs (IS 1293)</option>
                  <option>Household Electrical Appliances (IS 302)</option>
                  <option>Information Technology Goods (CRS Scheme II)</option>
                  <option>LED & Electronic Controlgear (IS 15885)</option>
                  <option>Heavy Machinery & Industrial Equipment</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Submit Demo Request</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="py-6 text-center space-y-3 font-sans">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-[#0F172A] text-sm">Demo Request Received</div>
                <p className="text-[#64748B] text-xs max-w-sm mx-auto leading-relaxed">
                  Thank you, <span className="font-semibold text-[#0F172A]">{formData.fullName}</span>. Our technical compliance team will contact you at <span className="font-mono text-[#0F172A]">{formData.email}</span> within one business day.
                </p>
              </div>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Back to ComplyWise
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestDemoModal;
