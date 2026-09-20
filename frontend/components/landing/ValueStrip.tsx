"use client";

import React from "react";
import { BookOpen, ShieldCheck, FileText, CheckCircle2, GitFork, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function ValueStrip() {
  const pillars = [
    { label: "Standards", icon: BookOpen, desc: "Mandatory IS & QCOs" },
    { label: "Requirements", icon: ShieldCheck, desc: "Deterministic logic" },
    { label: "Documents", icon: FileText, desc: "Testing & statutory dossiers" },
    { label: "Evidence", icon: CheckCircle2, desc: "Authoritative provenance" },
    { label: "Workflows", icon: GitFork, desc: "Departmental clearances" },
    { label: "BIS Agent", icon: Sparkles, desc: "Source-grounded assistance" },
  ];

  return (
    <section className="border-y border-cw-parchment bg-cw-cream py-6 sm:py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-cw-parchment"
        >
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.label}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                }}
                className="flex flex-col items-center text-center p-3 sm:px-4 sm:py-2 group"
              >
                <div className="h-7 w-7 rounded-lg bg-cw-parchment/60 text-cw-forest flex items-center justify-center mb-1.5 group-hover:bg-cw-parchment transition-colors border border-cw-sage/30">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="text-xs font-semibold text-cw-charcoal font-serif">
                  {pillar.label}
                </div>
                <div className="text-[11px] text-cw-forest/80 mt-0.5 font-normal font-sans">
                  {pillar.desc}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default ValueStrip;
