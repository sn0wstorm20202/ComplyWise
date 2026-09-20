"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import HeroProductPreview from "./HeroProductPreview";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

interface HeroSectionProps {
  onRequestDemo: () => void;
}

export function HeroSection({ onRequestDemo }: HeroSectionProps) {
  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-cw-cream via-cw-parchment/30 to-cw-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Hero Content */}
        <motion.div 
          className="text-center max-w-3xl mx-auto space-y-6 relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Subtle announcement / Evolution signal */}
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 rounded-full border border-cw-sage/30 bg-white/40 backdrop-blur-sm px-4 py-1.5 text-xs text-cw-forest shadow-sm transition-all hover:bg-white/60">
              <span className="font-semibold text-cw-charcoal flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cw-terracotta animate-pulse" />
                ComplyWise Platform
              </span>
              <span className="text-cw-sage-deep">·</span>
              <span className="text-cw-forest/80 hidden sm:inline">
                Deterministic compliance intelligence and connected workflows for Indian manufacturing.
              </span>
              <span className="text-cw-forest/80 sm:hidden">
                Active build
              </span>
            </div>
          </motion.div>

          {/* Eyebrow */}
          <motion.div variants={itemVariants} className="text-[11px] font-bold tracking-widest text-cw-sage-deep uppercase font-mono">
            BIS COMPLIANCE INTELLIGENCE
          </motion.div>

          {/* Main Headline & Secondary Line */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-cw-charcoal leading-[1.1] font-serif">
              Stay ahead of compliance.
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl font-medium text-cw-forest tracking-tight font-serif italic opacity-90">
              Understand what applies. Act with confidence.
            </p>
          </motion.div>

          {/* Supporting Paragraph */}
          <motion.div variants={itemVariants}>
            <p className="text-sm sm:text-base text-cw-charcoal/70 leading-relaxed max-w-2xl mx-auto font-normal font-sans">
              ComplyWise unifies BIS standards, statutory requirements, laboratory dossiers, and regulatory gazettes into one calm, connected operational workspace.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl bg-cw-terracotta hover:bg-cw-clay text-white px-7 py-3.5 text-xs sm:text-sm font-semibold shadow-[0_4px_14px_0_rgba(216,121,76,0.39)] hover:shadow-[0_6px_20px_rgba(216,121,76,0.23)] hover:-translate-y-0.5 transition-all"
            >
              <span>Explore Architecture</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-cw-sage-deep/30 bg-white/50 backdrop-blur-sm hover:bg-white text-cw-forest px-7 py-3.5 text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <span>Launch Live Dashboard</span>
              <ChevronRight className="h-4 w-4 text-cw-sage-deep" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero Product Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          id="product" 
          className="mt-14 sm:mt-20 relative z-20"
        >
          <HeroProductPreview />
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
