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
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Folder className="h-3.5 w-3.5 text-slate-400" />
              <span>Home Page</span>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <span className="text-slate-600 font-semibold">Business Profile</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Enterprise Regulatory Profile
            </h1>
            <p className="text-xs text-slate-500">
              Statutory identity, manufacturing scale, BIS CM/L license credentials, and multi-tenant switchboard.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/onboarding?new=true"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Assessment</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#0f172a] text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditing ? "Cancel Edit" : "Edit Profile"}</span>
            </button>
          </div>
        </div>

        {/* Saved Success Notification */}
        {savedNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>Profile successfully updated! All dashboard metrics and compliance mandates have re-synchronized.</span>
          </div>
        )}

        {/* Switch Company Banner */}
        <div className="bg-white rounded-[28px] border border-slate-200/70 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Switch Demo Entity Profile</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Changes propagate instantaneously across all dashboard cards & charts
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
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  profile.id === p.id
                    ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200 shadow-xs"
                    : "bg-slate-50/60 border-slate-200/70 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs truncate max-w-[180px]">
                    {p.businessName}
                  </span>
                  {profile.id === p.id && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-indigo-200" />
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{p.state} · {p.scale.split("(")[0]}</div>
                <div className="text-[10px] font-mono text-indigo-600 mt-1">{p.bisRegistration}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Content / Edit Form */}
        <div className="bg-white rounded-[28px] border border-slate-200/70 p-6 sm:p-8 shadow-xs">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Legal Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    BIS License Number (CM/L)
                  </label>
                  <input
                    type="text"
                    value={formData.bisRegistration}
                    onChange={(e) => setFormData({ ...formData, bisRegistration: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-blue-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    PAN (Permanent Account Number)
                  </label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Constitution Type
                  </label>
                  <input
                    type="text"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Registered State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Employee Count
                  </label>
                  <input
                    type="number"
                    value={formData.employeeCount}
                    onChange={(e) => setFormData({ ...formData, employeeCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Manufacturing Facility Address
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0f172a] text-white text-xs font-bold hover:bg-slate-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Legal Business Name
                  </div>
                  <div className="font-bold text-slate-950 text-base mt-0.5">
                    {profile.businessName}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    BIS License (CM/L)
                  </div>
                  <div className="font-mono font-bold text-blue-900 text-base mt-0.5">
                    {profile.bisRegistration}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    PAN
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {profile.pan}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Industrial Sector
                  </div>
                  <div className="text-slate-800 font-medium text-xs mt-0.5">
                    {profile.sector}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    MSME Classification
                  </div>
                  <div className="text-slate-800 font-medium text-xs mt-0.5">
                    {profile.scale}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Employees
                  </div>
                  <div className="text-slate-800 font-bold text-sm mt-0.5">
                    {profile.employeeCount} active workers
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Factory & Premises Address
                  </div>
                  <div className="text-slate-800 font-medium text-xs mt-0.5">
                    {profile.location}
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Registered Manufacturing Activities & Products
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.activities.map((act, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-medium text-xs"
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
