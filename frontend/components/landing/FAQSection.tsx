"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
        "question": "How does ComplyWise know what applies to my business?",
        "answer": "It starts with what your business does, where it operates and the details that matter. Rules check those details against the conditions in the available regulatory sources. Each result shows its reason and source."
    },
    {
        "question": "What happens when you need more information from me?",
        "answer": "When a missing detail could change a result, ComplyWise asks a focused question. You can see why that detail matters before answering."
    },
    {
        "question": "Can I see where a requirement came from?",
        "answer": "Yes. Results connect to their source and the relevant passage. The source details help you review the basis for a requirement."
    },
    {
        "question": "What does ComplyWise help me do after a requirement is found?",
        "answer": "You can keep requirements, supporting documents, workflows and important dates together in a workspace. This helps your team turn a result into a task you can track."
    },
    {
        "question": "Which businesses and jurisdictions are currently covered?",
        "answer": "The current focus is Indian businesses, with Central Government and Maharashtra sources. Coverage depends on your activity and the available regulatory knowledge; the sectors shown are examples, not a promise of complete coverage."
    },
    {
        "question": "Does ComplyWise replace professional legal or compliance advice?",
        "answer": "No. ComplyWise helps you understand and organise requirements with their supporting sources. Professional advice remains important when a situation needs interpretation or specialist judgement."
    }
];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-32 md:py-48 bg-[#F7F5EF] border-t border-[rgba(23,23,20,0.06)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column: Editorial Headline & Subtitle */}
          <div className="lg:col-span-5 space-y-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#96938A]">
              YOUR QUESTIONS
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#171714] leading-[1.08] tracking-[-0.02em]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#6F6D66] font-light leading-relaxed max-w-sm">
              A few practical answers about your business, the sources and what happens next.
            </p>
          </div>

          {/* Right Column: Editorial Accordion (Thin Borders, No Giant Boxes) */}
          <div className="lg:col-span-7 divide-y divide-[rgba(23,23,20,0.08)]">
            {faqs.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div key={idx} className={`faq-row py-6 sm:py-7 ${isOpen ? "is-open" : ""}`}>
                  <button
                    onClick={() => toggleFAQ(idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    id={`faq-question-${idx}`}
                    className="w-full flex items-start justify-between gap-6 text-left group cursor-pointer focus:outline-none"
                  >
                    <span className="font-serif text-lg sm:text-xl text-[#171714] group-hover:text-[#557D6B] transition-colors leading-snug">
                      {item.question}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                        isOpen
                          ? "bg-[#DCEAE2] border-[#7FAF9A] text-[#557D6B] rotate-45"
                          : "bg-transparent border-[rgba(23,23,20,0.15)] text-[#171714] group-hover:border-[#557D6B] group-hover:text-[#557D6B]"
                      }`}
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                  </button>

                  {/* Smooth height transition container */}
                  <div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-question-${idx}`}
                    aria-hidden={!isOpen}
                    className={`grid transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100 pt-4"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm text-[#6F6D66] font-light leading-relaxed pr-8">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
