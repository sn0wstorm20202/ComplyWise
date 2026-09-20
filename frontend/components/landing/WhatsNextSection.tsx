"use client";

import React from "react";
import { GitFork, Scale, BookOpen, CheckCircle2, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export function WhatsNextSection() {
  const capabilities = [
    {
      id: "workflows",
      title: "Connected Compliance Workflows",
      status: "In development",
      statusColor: "bg-cw-parchment text-cw-charcoal border-cw-sage/30",
      description:
        "Automating multi-step clearance procedures across state pollution control boards, factory safety inspectorates, and the central BIS Manakonline portal.",
      milestone: "Phase 2 Delivery",
    },
    {
      id: "intelligence",
      title: "Deeper Regulatory Intelligence",
      status: "Expanding",
      statusColor: "bg-cw-sage/20 text-cw-forest border-cw-sage",
      description:
        "Automated Gazette of India monitoring with clause-level text diffs to immediately detect when new Quality Control Orders affect approved manufacturing lines.",
      milestone: "Continuous Integration",
    },
    {
      id: "standards",
      title: "Expanded BIS Standards Coverage",
      status: "Being built",
      statusColor: "bg-cw-parchment text-cw-charcoal border-cw-sage/30",
      description:
        "Extending verified knowledge packs beyond electrical equipment into industrial machinery, chemicals, polymers, steel products, and medical devices.",
      milestone: "Knowledge Pack V2.4",
    },
    {
      id: "evidence",
      title: "Evidence & Requirement Tracking",
      status: "In development",
      statusColor: "bg-cw-parchment text-cw-charcoal border-cw-sage/30",
      description:
        "Traceable NABL test report verification, automated instrument calibration expiry warnings, and one-click surveillance audit dossier generation.",
      milestone: "Audit Automation",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-cw-parchment/30 border-b border-cw-parchment overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl space-y-2"
        >
          <div className="text-[11px] font-bold text-cw-sage-deep uppercase tracking-widest font-mono">
            Platform Roadmap
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-cw-charcoal font-serif">
            What’s being built next.
          </h2>
          <p className="text-xs sm:text-sm text-cw-forest/80 leading-relaxed font-sans">
            ComplyWise is systematically expanding its regulatory knowledge graph, automation pipelines, and operational integrations.
          </p>
        </motion.div>

        {/* Open Editorial List */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.15 } }
          }}
          className="divide-y divide-cw-parchment border-t border-b border-cw-parchment"
        >
          {capabilities.map((cap) => (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
              }}
              key={cap.id}
              className="py-6 sm:py-8 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-baseline group hover:bg-cw-cream transition-colors px-3 -mx-3 rounded-xl"
            >
              <div className="md:col-span-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-cw-charcoal group-hover:text-cw-forest transition-colors font-serif">
                    {cap.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold border ${cap.statusColor}`}
                  >
                    {cap.status}
                  </span>
                  <span className="font-mono text-[10px] text-cw-sage-deep">
                    {cap.milestone}
                  </span>
                </div>
              </div>

              <div className="md:col-span-8">
                <p className="text-xs sm:text-sm text-cw-forest/80 leading-relaxed max-w-3xl font-sans">
                  {cap.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Subtle Bottom Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-cw-sage-deep pt-2 font-mono"
        >
          <span>Active development cycle · Modular monolith architecture</span>
          <span className="text-cw-charcoal font-semibold">Updated weekly</span>
        </motion.div>
      </div>
    </section>
  );
}

export default WhatsNextSection;
