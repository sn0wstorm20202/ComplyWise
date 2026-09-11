"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useBusinessContext } from "@/context/BusinessContext";
import {
  Folder,
  ChevronRight,
  Building2,
  FileCheck,
  ShieldCheck,
  Edit3,
  Check,
  X,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function BusinessProfilePage() {
  const { profile, updateProfile, availableProfiles, switchProfile, isDemoMode } = useBusinessContext();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    businessName: profile.businessName,
    businessType: profile.businessType,
    pan: profile.pan,
    state: profile.state,
    district: profile.district,
    location: profile.location,
    employeeCount: profile.employeeCount,
    scale: profile.scale,
    officer: profile.officer,
    role: profile.role,
    bisRegistration: profile.bisRegistration,
  });
  const [savedNotice, setSavedNotice] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateProfile({
      ...formData,
      employeeCount: Number(formData.employeeCount),
    });
    setIsEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  }

  return (
    <AppShell activeView="profile">
      <div className="space-y-6 pb-6 select-none max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-[#777a88] font-medium">
              <Folder className="h-3.5 w-3.5 text-[#777a88]" />
              <Link href="/dashboard" className="hover:text-[#ffffff] transition-colors">Dashboard</Link>
              <ChevronRight className="h-3 w-3 text-[#5e616e]" />
              <span className="text-[#ffffff] font-semibold">Business Profile</span>
            </div>
            <h1 className="text-3xl font-serif font-medium tracking-tight text-[#ffffff]">
              Enterprise Regulatory Profile
            </h1>
            <p className="text-xs text-[#777a88]">
              Statutory identity, manufacturing scale, BIS CM/L license credentials, and multi-tenant switchboard.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/onboarding?new=true"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#2e3038] bg-[#121317] text-xs font-semibold text-[#e2e3e9] hover:border-[#cc9166]/60 transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 text-[#cc9166]" />
              <span>New Assessment</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#ffffff] text-[#08080a] text-xs font-bold hover:bg-[#e2e3e9] transition-colors shadow-xs cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditing ? "Cancel Edit" : "Edit Profile"}</span>
            </button>
          </div>
        </div>

        {/* Saved Success Notification */}
        {savedNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-400 font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>Profile successfully updated! All dashboard metrics and compliance mandates have re-synchronized.</span>
          </div>
        )}

        {/* Switch Company Banner */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1c1d22] pb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#cc9166]" />
              <h2 className="text-sm font-serif font-semibold text-[#ffffff]">Switch Demo Entity Profile</h2>
            </div>
            <span className="text-[11px] text-[#777a88] font-medium">
              Changes propagate instantaneously across all dashboard cards &amp; charts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {availableProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  switchProfile(p.id);
                  setFormData({
                    businessName: p.businessName,
                    businessType: p.businessType,
                    pan: p.pan,
                    state: p.state,
                    district: p.district,
                    location: p.location,
                    employeeCount: p.employeeCount,
                    scale: p.scale,
                    officer: p.officer,
                    role: p.role,
                    bisRegistration: p.bisRegistration,
                  });
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  profile.id === p.id
                    ? "bg-[#1c140d] border-[#cc9166]/60 ring-1 ring-[#cc9166]/50 shadow-xs"
                    : "bg-[#121317] border-[#1c1d22] hover:border-[#2e3038]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#ffffff] text-xs truncate max-w-[180px]">
                    {p.businessName}
                  </span>
                  {profile.id === p.id && (
                    <span className="h-2 w-2 rounded-full bg-[#cc9166] ring-2 ring-[#cc9166]/30" />
                  )}
                </div>
                <div className="text-[11px] text-[#777a88] mt-1">{p.state} · {p.scale.split("(")[0]}</div>
                <div className="text-[10px] font-mono text-[#cc9166] mt-1">{p.bisRegistration}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Content / Edit Form */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 shadow-2xl">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="font-medium text-[#9194a1] block mb-1.5">
                    Legal Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1c1d22] bg-[#121317] text-sm text-[#ffffff] focus:outline-hidden focus:border-[#cc9166] focus:ring-1 focus:ring-[#cc9166]"
                    required
                  />
                </div>

                <div>
                  <label className="font-medium text-[#9194a1] block mb-1.5">
                    BIS License Number (CM/L)
                  </label>
                  <input
                    type="text"
                    value={formData.bisRegistration}
                    onChange={(e) => setFormData({ ...formData, bisRegistration: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1c1d22] bg-[#121317] text-sm font-mono text-[#cc9166] focus:outline-hidden focus:border-[#cc9166] focus:ring-1 focus:ring-[#cc9166]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#9194a1] block mb-1.5">
                    PAN (Permanent Account Number)
                  </label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1c1d22] bg-[#121317] text-sm font-mono text-[#ffffff] uppercase focus:outline-hidden focus:border-[#cc9166] focus:ring-1 focus:ring-[#cc9166]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#9194a1] block mb-1.5">
                    Constitution Type
                  </label>
                  <input
                    type="text"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1c1d22] bg-[#121317] text-sm text-[#ffffff] focus:outline-hidden focus:border-[#cc9166] focus:ring-1 focus:ring-[#cc9166]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#9194a1] block mb-1.5">
                    Registered State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1c1d22] bg-[#121317] text-sm text-[#ffffff] focus:outline-hidden focus:border-[#cc9166] focus:ring-1 focus:ring-[#cc9166]"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#9194a1] block mb-1.5">
                    Employee Count
                  </label>
                  <input
                    type="number"
                    value={formData.employeeCount}
                    onChange={(e) => setFormData({ ...formData, employeeCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1c1d22] bg-[#121317] text-sm text-[#ffffff] focus:outline-hidden focus:border-[#cc9166] focus:ring-1 focus:ring-[#cc9166]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-medium text-[#9194a1] block mb-1.5">
                    Manufacturing Facility Address
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1c1d22] bg-[#121317] text-sm text-[#ffffff] focus:outline-hidden focus:border-[#cc9166] focus:ring-1 focus:ring-[#cc9166]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1c1d22]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2 rounded-full border border-[#2e3038] bg-[#121317] text-xs font-semibold text-[#e2e3e9] hover:border-[#cc9166]/50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#ffffff] text-[#08080a] text-xs font-bold hover:bg-[#e2e3e9] cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#777a88]">
                    Legal Business Name
                  </div>
                  <div className="font-serif font-medium text-[#ffffff] text-base mt-0.5">
                    {profile.businessName}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#777a88]">
                    BIS License (CM/L)
                  </div>
                  <div className="font-mono font-bold text-[#cc9166] text-base mt-0.5">
                    {profile.bisRegistration}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#777a88]">
                    PAN
                  </div>
                  <div className="font-mono font-medium text-[#ffffff] text-sm mt-0.5">
                    {profile.pan}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#777a88]">
                    Industrial Sector
                  </div>
                  <div className="text-[#e2e3e9] font-medium text-xs mt-0.5">
                    {profile.sector}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#777a88]">
                    MSME Classification
                  </div>
                  <div className="text-[#e2e3e9] font-medium text-xs mt-0.5">
                    {profile.scale}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#777a88]">
                    Employees
                  </div>
                  <div className="text-[#ffffff] font-medium text-sm mt-0.5">
                    {profile.employeeCount} active workers
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-3 pt-4 border-t border-[#1c1d22]">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#777a88]">
                    Factory &amp; Premises Address
                  </div>
                  <div className="text-[#e2e3e9] font-medium text-xs mt-1">
                    {profile.location}
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-3 pt-4 border-t border-[#1c1d22]">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#777a88] mb-2.5">
                    Registered Manufacturing Activities &amp; Products
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.activities.map((act, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1 rounded-full bg-[#121317] border border-[#1c1d22] text-[#e2e3e9] font-medium text-xs hover:border-[#2e3038] transition-colors"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
