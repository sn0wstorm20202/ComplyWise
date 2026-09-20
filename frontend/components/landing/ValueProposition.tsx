"use client";

import React from "react";
import { CheckCircle2, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function ValueProposition() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-cw-parchment/30 border-b border-cw-parchment">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl space-y-2"
        >
          <div className="text-[11px] font-bold text-cw-sage-deep uppercase tracking-widest font-mono">
            Operational Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-cw-charcoal font-serif">
            Compliance intelligence built for real operations.
          </h2>
          <p className="text-xs sm:text-sm text-cw-forest/80 leading-relaxed font-sans">
            Eliminate ambiguity. ComplyWise connects statutory gazettes, technical standard clauses, and plant documentation into a clear operational roadmap.
          </p>
        </motion.div>

        {/* Open Editorial Sections (Thin Dividers, Open Layout) */}
        <div className="divide-y divide-cw-parchment border-t border-b border-cw-parchment">
          {/* 01 — Understand */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            <div className="lg:col-span-5 space-y-3">
              <span className="font-mono text-xs font-bold text-cw-charcoal bg-cw-parchment/60 px-2.5 py-1 rounded-md border border-cw-sage/30">
                01 — Understand
              </span>
              <h3 className="text-lg sm:text-xl font-medium text-cw-charcoal leading-snug font-serif">
                Find the standards, clauses and requirements relevant to your business.
              </h3>
              <p className="text-xs sm:text-sm text-cw-forest/80 leading-relaxed font-sans">
                Rather than browsing thousands of pages of BIS standards and Quality Control Orders manually, ComplyWise maps your manufacturing scope, product categories, and raw materials directly to authoritative statutory clauses.
              </p>
            </div>

            <div className="lg:col-span-7 bg-cw-cream p-6 rounded-2xl border border-cw-parchment shadow-sm text-xs space-y-4">
              <div className="text-[10px] font-semibold text-cw-sage-deep uppercase tracking-wider font-mono">
                Statutory Mapping Pipeline
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-cw-parchment/40 border border-cw-sage/30 space-y-1">
                  <div className="text-[10px] font-mono text-cw-sage-deep">INPUT SCOPE</div>
                  <div className="font-semibold text-cw-charcoal font-serif">16A Domestic Plug</div>
                  <div className="text-[11px] text-cw-forest/80">Molded polycarbonate</div>
                </div>

                <div className="p-3.5 rounded-xl bg-cw-parchment/40 border border-cw-sage/30 space-y-1">
                  <div className="text-[10px] font-mono text-cw-charcoal font-semibold">MANDATORY STANDARD</div>
                  <div className="font-semibold text-cw-charcoal font-serif">IS 1293:2019</div>
                  <div className="text-[11px] text-cw-forest/80">Scheme I (ISI Mark)</div>
                </div>

                <div className="p-3.5 rounded-xl bg-cw-parchment/40 border border-cw-sage/30 space-y-1">
                  <div className="text-[10px] font-mono text-cw-forest font-semibold">ENFORCING ORDER</div>
                  <div className="font-semibold text-cw-charcoal font-serif">QCO S.O. 1421(E)</div>
                  <div className="text-[11px] text-cw-forest/80">DPIIT Gazette Notification</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 02 — Analyse */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            <div className="lg:col-span-5 space-y-3">
              <span className="font-mono text-xs font-bold text-cw-charcoal bg-cw-parchment/60 px-2.5 py-1 rounded-md border border-cw-sage/30">
                02 — Analyse
              </span>
              <h3 className="text-lg sm:text-xl font-medium text-cw-charcoal leading-snug font-serif">
                Connect documents, requirements, regulatory changes and evidence.
              </h3>
              <p className="text-xs sm:text-sm text-cw-forest/80 leading-relaxed font-sans">
                Track whether laboratory test reports meet the specific testing parameters required by BIS. Identify missing calibration certificates or expired evidence records before surveillance auditors arrive.
              </p>
            </div>

            <div className="lg:col-span-7 bg-cw-cream p-6 rounded-2xl border border-cw-parchment shadow-sm text-xs space-y-3">
              <div className="text-[10px] font-semibold text-cw-sage-deep uppercase tracking-wider font-mono">
                Evidence Traceability Matrix
              </div>
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-cw-parchment/40 border border-cw-sage/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-cw-forest shrink-0" />
                    <div>
                      <div className="font-semibold text-cw-charcoal text-xs font-serif">NABL Test Report #TR-1293</div>
                      <div className="text-[11px] text-cw-forest/80">Clause 18: Temperature rise within 45K limit verified</div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-cw-forest bg-cw-sage/20 px-2 py-0.5 rounded-md border border-cw-sage">
                    VERIFIED
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-cw-parchment/40 border border-cw-sage/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-cw-clay shrink-0" />
                    <div>
                      <div className="font-semibold text-cw-charcoal text-xs font-serif">High Voltage Rig Calibration</div>
                      <div className="text-[11px] text-cw-forest/80">Calibration certificate renewal required before audit</div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-cw-terracotta bg-cw-clay/10 px-2 py-0.5 rounded-md border border-cw-clay/30">
                    RENEWAL DUE
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 03 — Act */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            <div className="lg:col-span-5 space-y-3">
              <span className="font-mono text-xs font-bold text-cw-charcoal bg-cw-parchment/60 px-2.5 py-1 rounded-md border border-cw-sage/30">
                03 — Act
              </span>
              <h3 className="text-lg sm:text-xl font-medium text-cw-charcoal leading-snug font-serif">
                Turn compliance intelligence into clear next actions and workflows.
              </h3>
              <p className="text-xs sm:text-sm text-cw-forest/80 leading-relaxed font-sans">
                Stay ahead of statutory deadlines with structured clearance workflows. Assign responsibility, monitor departmental turnaround times, and file annual returns on time.
              </p>
            </div>

            <div className="lg:col-span-7 bg-cw-cream p-6 rounded-2xl border border-cw-parchment shadow-sm text-xs space-y-3">
              <div className="text-[10px] font-semibold text-cw-sage-deep uppercase tracking-wider font-mono">
                Departmental Clearance Workflow
              </div>
              <div className="p-4 rounded-xl bg-cw-parchment/40 border border-cw-sage/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cw-charcoal font-serif">BIS Scheme I Certification (ISI Mark)</span>
                  <span className="font-mono text-[11px] text-cw-forest/80">Step 3 of 5</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-cw-parchment overflow-hidden border border-cw-sage/30">
                  <div className="w-3/5 h-full bg-cw-terracotta rounded-full" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-cw-forest/80 pt-1">
                  <span>Current: Laboratory Sample Testing</span>
                  <span className="text-cw-charcoal font-semibold">In Progress</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ValueProposition;
