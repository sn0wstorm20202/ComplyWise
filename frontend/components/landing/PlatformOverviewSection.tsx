"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, CheckCircle2, Shield, Layers } from "lucide-react";
import { motion } from "framer-motion";
import HeroProductPreview from "./HeroProductPreview";

export function PlatformOverviewSection() {
  return (
    <section className="py-20 md:py-28 bg-cw-parchment/30 border-b border-cw-parchment">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Copy */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto space-y-4"
        >
          <div className="text-[11px] font-bold text-cw-sage-deep uppercase tracking-widest font-mono">
            Operational Workspace
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-cw-charcoal font-serif">
            One place for your compliance picture.
          </h2>
          <p className="text-xs sm:text-sm text-cw-forest/80 leading-relaxed font-sans">
            Requirements, deadlines, documents, standards, and regulatory updates unified into a single operational interface.
          </p>

          <div className="pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-cw-terracotta hover:bg-cw-clay text-white px-6 py-3 text-xs sm:text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5"
            >
              <span>Explore Workspace</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        {/* Browser Frame Preview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="pt-4"
        >
          <HeroProductPreview />
        </motion.div>
      </div>
    </section>
  );
}

export default PlatformOverviewSection;
