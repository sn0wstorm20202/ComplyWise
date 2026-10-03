"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, FileText, Fingerprint, HelpCircle, ShieldCheck } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import WorkspaceStoryScene, { type WorkspaceTab } from "./WorkspaceStoryScene";
import { createObjectRegistry } from "./motion/physicalWorld";
import "./physical-product-story.css";

gsap.registerPlugin(ScrollTrigger);

const chapters = [
  { label: "A business. A rulebook.", title: "Behind every business is a rulebook.", body: "ComplyWise helps you understand what applies to your business — and what to do next." },
  { label: "01 / Your business", title: "Start with what you do.", body: "Tell us about your business in plain language. We turn it into the details that matter for compliance." },
  { label: "02 / What matters", title: "Your words. The details that matter.", body: "Location, activity, structure and operations. One business description becomes a clear starting point." },
  { label: "03 / The missing detail", title: "Only answer what changes the answer.", body: "When an important detail is missing, we pause. You don’t need to work through a form that asks everything." },
  { label: "04 / A useful question", title: "One answer opens the next step.", body: "A question comes from the missing detail. Your answer becomes part of the business profile." },
  { label: "05 / The regulatory world", title: "Find the rules that belong to you.", body: "Your business context guides the search across authorities, requirements and standards." },
  { label: "06 / The source", title: "Start at the source.", body: "Open the document. Find the passage that matters. Keep its context close." },
  { label: "07 / The rule", title: "See why it applies.", body: "The relevant passage becomes a rule that can be checked against your business details." },
  { label: "08 / The decision", title: "The details come together.", body: "Conditions resolve one by one. The result follows the rule, with a reason you can review." },
  { label: "09 / The evidence", title: "Every decision has a trail.", body: "Trace the result back through the rule and relevant passage to its source." },
  { label: "10 / The next step", title: "An answer becomes an action.", body: "The source stays attached as the requirement becomes a task for your team." },
  { label: "11 / Your workspace", title: "Turn requirements into next steps.", body: "The result you just saw now has a place to live. Review it, assign an owner and track progress." },
  { label: "12 / Documents", title: "Keep the evidence close.", body: "Business documents and supporting records sit alongside the requirements they help explain." },
  { label: "13 / Workflows", title: "Make progress together.", body: "Give the next step an owner. Keep the handover and review in one place." },
  { label: "14 / Calendar", title: "Put the next step on the calendar.", body: "Set team reminders and see what needs attention next." },
  { label: "15 / Schemes & standards", title: "Keep the wider picture in view.", body: "Explore relevant schemes and standards with your business context still attached." },
  { label: "16 / How ComplyWise works", title: "The rules decide. The AI explains.", body: "Business context leads to a source. A rule leads to a decision. Evidence connects the whole journey." },
  { label: "17 / Your next chapter", title: "One business. A clearer way forward.", body: "You’ve seen the journey from a business description to a source-linked next step. Now explore the workspace." },
] as const;
const DURATION = chapters.length;
const SCROLL_DISTANCE = 1600;
const sourceNames = ["Central Government", "Maharashtra", "BIS", "Labour", "Environment", "Fire", "GST", "Standards", "Notifications", "Orders"];
const facts = [
  { label: "LOCATION", value: "Maharashtra", text: "Maharashtra", x: -130, y: -45 },
  { label: "ACTIVITY", value: "Manufacturing", text: "manufacture components", x: 115, y: -45 },
  { label: "ENTITY", value: "Private limited", text: "private limited business", x: -130, y: 70 },
  { label: "OPERATIONS", value: "Domestic distribution", text: "distribute across India", x: 115, y: 70 },
] as const;
const conditions = ["Business activity", "Business scale", "Jurisdiction", "Effective version", "Exemptions reviewed"];

function Dossier({ structured = false }: { structured?: boolean }) {
  const [highlight, setHighlight] = useState<number | null>(null);
  return <div className={`film-dossier paper-object ${structured ? "is-structured" : ""}`} data-inspect="Business profile">
    <div className="dossier-spine" aria-hidden="true" />
    <div className="dossier-header"><span className="film-mono">BUSINESS / 001</span><Fingerprint size={22} strokeWidth={1} /></div>
    <h3>Aster Precision</h3>
    <p className="dossier-location">Pune, Maharashtra <span>Illustrative business</span></p>
    <div className="dossier-statement">
      <span className="film-prose-glue">We are a </span><span className="film-extracted-word" data-highlighted={highlight === 2}>{facts[2].text}</span>
      <span className="film-prose-glue"> in </span><span className="film-extracted-word" data-highlighted={highlight === 0}>{facts[0].text}</span>
      <span className="film-prose-glue">. We </span><span className="film-extracted-word" data-highlighted={highlight === 1}>{facts[1].text}</span>
      <span className="film-prose-glue"> and </span><span className="film-extracted-word" data-highlighted={highlight === 3}>{facts[3].text}</span><span className="film-prose-glue">.</span>
    </div>
    <div className="dossier-facts">
      {facts.map((fact, index) => <button key={fact.label} className="film-fact" data-fact={index} aria-label={`${fact.label} ${fact.value}`} onMouseEnter={() => setHighlight(index)} onMouseLeave={() => setHighlight(null)} onFocus={() => setHighlight(index)} onBlur={() => setHighlight(null)} onClick={() => setHighlight(index)}>
        <span className="film-mono">{fact.label}</span><span className="film-fact-value">{fact.value}</span>
      </button>)}
    </div>
    <div className="film-missing"><span className="film-mono">BUSINESS SCALE</span><span>Annual turnover <HelpCircle size={17} /></span><small>One detail still needed</small></div>
    <div className="dossier-footer film-mono"><span>YOUR CONTEXT</span><span className="dossier-footer-state">THE STARTING POINT</span></div>
  </div>;
}

function Question() {
  const [selected, setSelected] = useState(false);
  return <div className={`film-question-card paper-object ${selected ? "is-selected" : ""}`}>
    <div className="question-origin film-mono"><HelpCircle size={16} /> BUSINESS SCALE</div>
    <h3>What is your annual turnover?</h3>
    <p>We ask when a detail may change which requirements need to be checked.</p>
    <button className="film-answer" aria-pressed={selected} onClick={() => setSelected(value => !value)}><span>{selected ? "Example selected: ₹18 Cr" : "Select example: ₹18 Cr"}</span><Check size={18} /></button>
    <div className="film-answer-path"><span /><p>{selected ? "Business profile updated" : "Scroll to follow the example"}<ArrowRight size={14} /></p></div>
    <small>Illustrative answer. No legal threshold is implied.</small>
  </div>;
}

function Archive() {
  return <div className="film-archive-field">
    <svg className="archive-orbit" viewBox="0 0 800 650" aria-hidden="true"><ellipse cx="400" cy="325" rx="340" ry="210" /><ellipse cx="400" cy="325" rx="250" ry="285" transform="rotate(25 400 325)" /><path d="M60 325H740M400 40V610" /></svg>
    {sourceNames.map((name, i) => <div className={`film-source ${i === 0 ? "is-primary" : ""}`} key={name} data-source={i} tabIndex={0} data-inspect="Source context">
      <div className="film-source-face paper-object"><span className="source-glyph"><FileText size={20} strokeWidth={1.3} /></span><span>{name}</span><small className="source-metadata film-mono">SOURCE CONTEXT</small></div>
    </div>)}
  </div>;
}

function Document() {
  return <div className="film-document-sheet paper-object" data-inspect="Source document">
    <div className="document-back-sheet" aria-hidden="true" />
    <div className="document-flap"><span className="film-mono">SOURCE DOCUMENT</span><ShieldCheck size={23} strokeWidth={1.3} /><span>Context before conclusion.</span></div>
    <div className="document-header"><span className="film-mono">ILLUSTRATIVE SOURCE</span><span className="document-seal">CW</span></div>
    <h3>Requirements &amp;<br /><em>their context.</em></h3>
    <div className="document-lines" aria-hidden="true"><i /><i /><i /></div>
    <div className="document-clause-well"><span className="film-mono">RELEVANT PASSAGE</span><p>The passage remains connected to the source, its version and the business details used.</p></div>
    <div className="document-lines" aria-hidden="true"><i /><i /></div>
    <footer className="film-mono">SOURCE · VERSION · JURISDICTION</footer>
  </div>;
}

function Rule({ staticMode = false }: { staticMode?: boolean }) {
  return <div className={`film-rule-card paper-object ${staticMode ? "is-assembled" : ""}`} data-inspect="Rule and reason">
    <div className="film-clause"><span className="film-mono">RELEVANT PASSAGE → RULE-014</span><p>Check the requirement against the business details that matter.</p></div>
    <div className="rule-blocks">
      {conditions.map((condition, i) => <div className="film-condition" key={condition}>
        <span className="condition-number film-mono">0{i + 1}</span><span>{condition}</span><span className="condition-check"><Check size={15} /></span><i className="film-condition-line" />
      </div>)}
      <small className="film-mono">EXAMPLE RULE CHECK / SOURCE-LINKED</small>
    </div>
    <svg className="film-convergence" viewBox="0 0 360 78" aria-hidden="true"><path d="M25 0V16Q25 35 55 35H155Q180 35 180 57V78M110 0V17Q110 35 150 35M250 0V17Q250 35 210 35M335 0V16Q335 35 305 35H205Q180 35 180 57" /></svg>
  </div>;
}

function Evidence() {
  return <div className="film-evidence-trail">
    <svg className="evidence-loop" viewBox="0 0 620 350" aria-hidden="true">
      <path className="evidence-loop-path" d="M480 275C590 275 605 80 430 65H180C-10 65 10 275 150 275H480" />
      <circle className="evidence-tracer" cx="480" cy="275" r="5" />
    </svg>
    <div className="evidence-stops film-mono"><span>SOURCE</span><span>CLAUSE</span><span>RULE</span><span>DECISION</span></div>
    <div className="film-evidence-sheet paper-object" tabIndex={0} data-inspect="Evidence trail">
      <span className="film-mono">EVIDENCE / RULE-014</span><h3>The reason stays attached.</h3>
      <p><mark>Your business details</mark> connect to <mark>the relevant passage</mark>, so you can follow the result back to its source.</p>
      <div className="evidence-source film-mono">SOURCE-LINKED · VERSIONED · ILLUSTRATIVE</div>
    </div>
  </div>;
}

function DecisionTask() {
  return <div className="film-task paper-object" data-world-object="decision-task" data-inspect="Decision and next step" tabIndex={0}>
    <div className="film-decision-header"><span className="decision-seal"><Check size={18} /></span><span className="film-decision-label">APPLICABLE</span><small className="film-mono">EXAMPLE RESULT</small></div>
    <div className="film-task-details"><h3>Review the requirement<br />and supporting document.</h3><p>RULE-014 · Source &amp; reason attached</p><div className="task-fields"><span>OWNER <strong>Your team</strong></span><span>STATUS <strong>Ready to review</strong></span><span>REMINDER <strong>Set by your team</strong></span></div><span className="task-evidence-cue film-mono"><FileText size={13} /> FOLLOW THE EVIDENCE</span></div>
  </div>;
}

function TrustChain() {
  return <div className="film-trust-chain"><span className="film-mono">ONE CONTINUOUS TRAIL</span><div>{["Business", "Source", "Rule", "Decision", "Evidence"].map((label, i) => <div className="trust-link paper-object" key={label}><span className="film-mono">0{i + 1}</span><strong>{label}</strong><Check size={16} /></div>)}</div></div>;
}

function ChapterCopy({ index, cinematic = false, active = true }: { index: number; cinematic?: boolean; active?: boolean }) {
  const chapter = chapters[index];
  return <div className={`film-copy ${index === 0 ? "film-hero-copy" : ""}`} data-copy={index} aria-hidden={cinematic && !active ? true : undefined} inert={cinematic && !active}>
    <div className="film-eyebrow film-mono"><span className={index === 0 ? "story-status-dot" : ""} />{chapter.label}</div>
    {index === 0 ? <h1><span className="hero-line"><span className="hero-line-text">Behind every</span></span><span className="hero-line"><span className="hero-line-text">business is a</span></span><span className="hero-line"><span className="hero-line-text"><em className="hero-italic">rulebook.</em></span></span></h1> : <h2>{chapter.title}</h2>}
    <p>{chapter.body}</p>
    {index === 0 && <div className="film-hero-actions"><Link className="film-primary-cta" href="/dashboard">Explore Workspace <ArrowUpRight size={17} /></Link><a className="film-secondary-cta" href="#story">Watch it unfold <ArrowDown size={16} /></a></div>}
    {index === 17 && <Link className="film-primary-cta" href="/dashboard">Explore Workspace <ArrowUpRight size={17} /></Link>}
  </div>;
}

function StaticStory() {
  return <div className="film-static">
    <section id="hero" className="film-static-hero"><ChapterCopy index={0} /><div className="static-dossier-world"><div className="static-source-strip film-mono"><FileText size={16} /> SOURCE-LINKED</div><Dossier /><span className="static-rule-strip film-mono">RULE → REASON → NEXT STEP</span></div></section>
    <section id="story"><ChapterCopy index={1} /><Dossier structured /></section>
    <section id="question"><ChapterCopy index={3} /><Question /></section>
    <section id="discovery"><ChapterCopy index={5} /><div className="static-archive"><Archive /></div></section>
    <section id="source"><ChapterCopy index={6} /><Document /></section>
    <section id="mechanism"><ChapterCopy index={7} /><Rule staticMode /></section>
    <section id="decision"><ChapterCopy index={8} /><div className="static-task-world"><DecisionTask /></div></section>
    <section id="evidence"><ChapterCopy index={9} /><Evidence /></section>
    <section id="action"><ChapterCopy index={10} /><div className="static-task-world is-action"><DecisionTask /></div></section>
    <WorkspaceStoryScene scrollTab="compliance" />
    <section id="principle"><ChapterCopy index={16} /><TrustChain /></section>
  </div>;
}

export default function PhysicalProductStory() {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const restoreChapterRef = useRef<string | null>(null);
  const [cinematic, setCinematic] = useState(false);
  const [phase, setPhase] = useState(0);
  const [standardsView, setStandardsView] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px) and (min-height: 680px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const update = () => {
      // Unwrap GSAP's pin before React replaces the stage with the static story.
      if (!media.matches && triggerRef.current) {
        const current = Number(rootRef.current?.dataset.phase ?? 0);
        restoreChapterRef.current = current >= 16 ? "principle" : current >= 11 ? "workspace" : current >= 10 ? "action" : current >= 9 ? "evidence" : current >= 7 ? "mechanism" : current >= 6 ? "source" : current >= 5 ? "discovery" : current >= 3 ? "question" : current >= 1 ? "story" : "hero";
        triggerRef.current.kill(true);
      }
      setCinematic(media.matches);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    if (!cinematic || !rootRef.current) {
      if (restoreChapterRef.current) {
        rootRef.current?.querySelector(`#${restoreChapterRef.current}`)?.scrollIntoView({ behavior: "instant", block: "start" });
        restoreChapterRef.current = null;
      }
      return;
    }
    const root = rootRef.current;
    const registry = createObjectRegistry(root);
    let detachPointer = () => {};
    let detachAmbient = () => {};
    const ctx = gsap.context(() => {
      const camera = root.querySelector<HTMLElement>(".film-camera")!;
      const pointerRig = root.querySelector<HTMLElement>(".film-pointer-rig")!;
      const get = registry.get;
      const business = get("business");
      const question = get("question");
      const archive = get("archive");
      const document = get("document");
      const rule = get("clause-rule");
      const task = get("decision-task");
      const workspace = get("workspace");
      const evidence = get("evidence");
      const trust = get("trust");
      const copies = root.querySelectorAll<HTMLElement>(".film-copy");
      const sources = root.querySelectorAll<HTMLElement>(".film-source");

      registry.setup("business", { x: 0, y: 0, z: 60, rotationX: 7, rotationY: -12, rotationZ: -3, scale: 1, autoAlpha: 1 });
      registry.setup("question", { x: 95, y: 170, z: 100, rotationX: -10, scale: .2, autoAlpha: 0 });
      registry.setup("archive", { x: 0, y: 0, z: -160, scale: .72, autoAlpha: .65 });
      registry.setup("document", { x: -260, y: -155, z: -50, rotationY: 15, rotationZ: -12, scale: .42, autoAlpha: .72 });
      registry.setup("clause-rule", { x: 255, y: 120, z: 100, rotationZ: 7, scale: .45, autoAlpha: .6 });
      registry.setup("workspace", { x: 0, y: 0, z: 0, scale: 1, autoAlpha: 1 });
      registry.setup("decision-task", { x: 95, y: 195, z: 160, scale: .65, autoAlpha: 0 });
      registry.setup("evidence", { x: 140, y: 180, z: 90, scale: .25, autoAlpha: 0 });
      registry.setup("trust", { x: 0, y: 0, z: 0, scale: .8, autoAlpha: 0 });
      gsap.set(camera, { rotationX: 2, rotationY: -3, z: 0 });
      gsap.set(copies, { autoAlpha: 0 }); gsap.set(copies[0], { autoAlpha: 1 });
      gsap.set(".dossier-facts, .film-missing, .rule-blocks, .film-convergence, .film-task-details", { autoAlpha: 0 });
      gsap.set(".film-fact", { y: 20, autoAlpha: 0 });
      gsap.set(".workspace-frame", { "--chrome-opacity": 0 });
      gsap.set(".workspace-browser-top, [role=tablist], .workspace-panel", { autoAlpha: 0 });
      gsap.set(".film-rule-card", { height: 145 });
      gsap.set(".film-document-sheet", { height: 405 });
      sources.forEach((source, i) => {
        const angle = (i / sources.length) * Math.PI * 2 - Math.PI / 2;
        gsap.set(source, { xPercent: -50, yPercent: -50, x: Math.cos(angle) * 310, y: Math.sin(angle) * 215, z: i % 2 ? -80 : 45, rotationZ: Math.cos(angle) * 5, scale: i === 0 ? 1 : .85, autoAlpha: i === 0 ? .8 : .32 });
      });

      let lastPhase = -1;
      let lastStandards = false;
      const timeline = gsap.timeline({ defaults: { duration: .65, ease: "power2.inOut" }, scrollTrigger: {
        id: "complywise-product-film", trigger: root, start: "top top", end: "bottom bottom", pin: ".film-stage", pinSpacing: false, scrub: 1.1, invalidateOnRefresh: true,
      }, onUpdate: () => {
        const next = Math.min(chapters.length - 1, Math.floor(timeline.time() + .45));
        if (lastPhase !== next) { lastPhase = next; setPhase(next); }
        const standards = next === 15 && timeline.time() >= 15.15;
        if (lastStandards !== standards) { lastStandards = standards; setStandardsView(standards); }
      }});
      triggerRef.current = timeline.scrollTrigger!;
      for (let i = 1; i < copies.length; i++) {
        timeline.to(copies[i - 1], { autoAlpha: 0, y: -18, duration: .25 }, i - .58)
          .fromTo(copies[i], { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: .4 }, i - .3);
      }

      // Approach: the camera inspects the same business dossier from the hero.
      timeline.to(camera, { z: 70, rotationX: 0, rotationY: 0 }, .45)
        .to(business, { x: 10, y: -20, rotationX: 0, rotationY: -3, rotationZ: 0, scale: 1.04 }, .45)
        .to(document, { x: -340, y: -220, autoAlpha: .25 }, .45)
        .to(rule, { x: 335, y: 210, autoAlpha: .2 }, .45)
        .to(archive, { scale: .95, autoAlpha: .25 }, .45);

      // The original words travel to the semantic slots; the dossier expands.
      timeline.to(".film-dossier", { height: 525 }, 1.45)
        .to(".film-prose-glue", { autoAlpha: 0, duration: .3 }, 1.45)
        .to(".dossier-facts", { autoAlpha: 1 }, 1.65)
        .to(".film-fact", { y: 0, autoAlpha: 1, stagger: .08 }, 1.65);
      const wordOrder = [2, 0, 1, 3];
      root.querySelectorAll<HTMLElement>(".film-extracted-word").forEach((word, i) => {
        const target = root.querySelector<HTMLElement>(`[data-fact="${wordOrder[i]}"] .film-fact-value`)!;
        // Measure within the unrotated paper, independent of camera perspective.
        const offset = (element: HTMLElement) => {
          let x = 0, y = 0; let node: HTMLElement | null = element;
          while (node && node !== business) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent as HTMLElement | null; }
          return { x, y };
        };
        timeline.to(word, { x: () => offset(target).x - offset(word).x, y: () => offset(target).y - offset(word).y, color: "#557D6B", scale: .76 }, 1.45 + i * .04);
      });
      timeline.to(".film-fact-value", { autoAlpha: 0 }, 1.5)
        .to(".film-missing", { autoAlpha: 1, y: 0 }, 2.4)
        .to(".film-fact", { opacity: .55, stagger: .04 }, 2.45)
        .to(business, { x: -30, rotationY: -8, scale: .94 }, 2.45);

      // The missing variable grows into a question, then becomes the doorway.
      timeline.to(question, { x: 75, y: 65, scale: 1, rotationX: 0, rotationY: 0, autoAlpha: 1 }, 3.4)
        .to(".film-missing", { scale: .95, backgroundColor: "#DCEAE2" }, 3.5)
        .to(business, { x: -145, y: -80, z: -80, scale: .75, autoAlpha: .45 }, 3.45)
        .to(".film-answer", { backgroundColor: "#DCEAE2", borderColor: "#7FAF9A" }, 4.1)
        .fromTo(".film-answer-path span", { scaleY: 0 }, { scaleY: 1 }, 4.1)
        .to(camera, { z: 160, rotationY: 3 }, 4.3)
        .to(question, { scale: 1.25, z: 250, y: 0 }, 4.3)
        .to(question, { scale: 1.7, z: 480, autoAlpha: 0, duration: .28 }, 4.8);

      // Pull back into the archive. Sources retain their orbital identity.
      timeline.to(camera, { z: -125, rotationX: 7, rotationY: -7 }, 4.8)
        .to(archive, { scale: 1.1, autoAlpha: 1, rotationY: 8 }, 4.8)
        .to(sources, { autoAlpha: .85, stagger: .035 }, 4.85)
        .to(business, { x: -210, y: 200, z: -80, scale: .35, autoAlpha: .4 }, 4.8)
        .to(document, { x: 0, y: -10, rotationY: 0, rotationZ: -5, scale: .58, autoAlpha: 1 }, 5.1)
        .to(rule, { autoAlpha: 0 }, 4.8)
        .to(sources[0], { x: 0, y: -200, z: 80, scale: 1.12, autoAlpha: 1 }, 5.0);
      timeline.to(camera, { z: 50, rotationX: 0, rotationY: 0 }, 5.5)
        .to(document, { x: 0, y: 0, z: 100, scale: 1.03, rotationZ: 0, rotationY: -5 }, 5.5)
        .to(".document-flap", { rotationX: -135, transformOrigin: "50% 0%", autoAlpha: 0, duration: .55 }, 5.65)
        .to(archive, { scale: 1.3, autoAlpha: .18, z: -280 }, 5.5)
        .to(business, { autoAlpha: .15 }, 5.5)
        .to(sources[0], { y: -140, scale: .7, autoAlpha: 0 }, 5.65)
        .set(rule, { x: 0, y: 62, z: 125, scale: .93, rotationZ: 0 }, 5.5)
        .set(".film-rule-card", { height: 130 }, 5.5)
        .to(rule, { autoAlpha: 1, duration: .2 }, 6.0);

      // The highlighted passage lifts from the page and assembles into the rule.
      timeline.to(rule, { x: 15, y: -30, z: 160, scale: 1.02 }, 6.5)
        .to(".film-rule-card", { height: 445 }, 6.5)
        .to(archive, { autoAlpha: .06 }, 6.5)
        .to(document, { x: -150, y: -30, z: -40, scale: .74, rotationY: -18, autoAlpha: .32 }, 6.5)
        .to(".rule-blocks", { autoAlpha: 1 }, 6.7)
        .fromTo(".film-condition", { x: 45, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: .08 }, 6.65)
        .to(".film-clause", { backgroundColor: "#EDF4F0" }, 6.6);
      timeline.fromTo(".condition-check", { scale: .4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, stagger: .12, duration: .22 }, 7.1)
        .fromTo(".film-condition-line", { scaleX: 0 }, { scaleX: 1, stagger: .12, duration: .26 }, 7.1)
        .to(".film-condition", { backgroundColor: "#EDF4F0", stagger: .12, duration: .24 }, 7.1)
        .to(".film-convergence", { autoAlpha: 1, duration: .4 }, 7.7)
        .fromTo(".film-convergence path", { strokeDasharray: 600, strokeDashoffset: 600 }, { strokeDashoffset: 0, duration: .45 }, 7.7)
        .to(task, { x: 20, y: 255, z: 170, scale: 1, autoAlpha: 1, duration: .3 }, 7.95)
        .to(rule, { scale: .94, y: -65 }, 8.1);

      // The result follows a visible loop back to the source and returns.
      timeline.to(camera, { z: -70, rotationY: 3 }, 8.5)
        .to(task, { x: 100, y: 165, scale: .95 }, 8.5)
        .to(rule, { x: -175, y: -85, z: -20, scale: .62, autoAlpha: .45 }, 8.5)
        .to(document, { x: -230, y: -145, z: -100, scale: .5, autoAlpha: .45 }, 8.5)
        .to(evidence, { x: 25, y: 0, scale: 1, z: 120, autoAlpha: 1 }, 8.65)
        .fromTo(".evidence-loop-path", { strokeDasharray: 1400, strokeDashoffset: 1400 }, { strokeDashoffset: 0, duration: 1 }, 8.65);
      const tracer = { progress: 0 };
      const path = root.querySelector<SVGPathElement>(".evidence-loop-path")!;
      const dot = root.querySelector<SVGCircleElement>(".evidence-tracer")!;
      timeline.to(tracer, { progress: 1, duration: 1.1, ease: "none", onUpdate: () => {
        const point = path.getPointAtLength(tracer.progress * path.getTotalLength());
        dot.setAttribute("cx", String(point.x)); dot.setAttribute("cy", String(point.y));
      } }, 8.6);

      // Same badge, expanded into a task. Its source metadata never detaches.
      timeline.to(task, { x: 5, y: 40, scale: 1, width: 440, height: 258 }, 9.55)
        .to(".film-task-details", { autoAlpha: 1, y: 0, duration: .35 }, 9.85)
        .to(evidence, { x: -130, y: -150, scale: .55, autoAlpha: .5 }, 9.55)
        .to(rule, { x: -245, y: 135, scale: .4, autoAlpha: .3 }, 9.55);

      // The workspace chrome grows around the existing task, rather than cutting.
      timeline.to(workspace, { x: 0, y: 35, z: 40, scale: .78, rotationX: 4, rotationY: -4 }, 10.55)
        .to(task, { x: 0, y: () => {
          const dock = root.querySelector<HTMLElement>(".film-task-dock");
          if (!dock) return 25;
          let top = 0;
          let node: HTMLElement | null = dock;
          while (node && node !== workspace) { top += node.offsetTop; node = node.offsetParent as HTMLElement | null; }
          return top + dock.offsetHeight / 2 - workspace.offsetHeight / 2;
        }, z: 1, width: 846, height: 208, scale: 1 }, 10.55)
        .to(".workspace-frame", { "--chrome-opacity": 1 }, 10.75)
        .to(".workspace-browser-top, [role=tablist], .workspace-panel", { autoAlpha: 1, stagger: .05 }, 10.8)
        .to(camera, { z: -45, rotationX: 0, rotationY: 0 }, 10.55)
        .to([rule, document, evidence, business], { autoAlpha: 0 }, 10.55)
        .to(archive, { autoAlpha: .025 }, 10.55)
        .to(workspace, { rotationX: 0, rotationY: 0, scale: .8 }, 11.5);
      timeline.to(workspace, { x: -8, y: 20, rotationY: 3 }, 12.5)
        .to(workspace, { x: 0, y: 35, rotationY: 0 }, 13.5)
        .to(workspace, { rotationX: 2, y: 20 }, 14.5);

      // Reuse the dossier, source, rule, evidence and result in the final chain.
      timeline.to(workspace, { scale: .3, x: 140, y: 185, z: -160, autoAlpha: 1 }, 15.5)
        .to(".workspace-frame", { "--chrome-opacity": .16 }, 15.5)
        .to(".workspace-browser-top, [role=tablist], .workspace-panel", { autoAlpha: .16 }, 15.5)
        .to(business, { x: -250, y: -30, z: 0, rotationY: 0, scale: .29, autoAlpha: .6 }, 15.5)
        .to(document, { x: -120, y: -30, rotationY: 0, scale: .28, autoAlpha: .7 }, 15.55)
        .to(rule, { x: 10, y: -30, scale: .28, autoAlpha: .7 }, 15.6)
        .to(task, { x: 0, y: -690, z: 0, width: 240, height: 80, scale: 1.05 }, 15.65)
        .to(".film-task-details", { autoAlpha: 0 }, 15.6)
        .to(evidence, { x: 280, y: -30, scale: .3, autoAlpha: .75 }, 15.65)
        .to(trust, { x: 0, y: 155, scale: 1, autoAlpha: 1 }, 15.75)
        .fromTo(".trust-link", { y: 12 }, { y: 0, stagger: .06 }, 15.75)
        .to(camera, { z: -140, rotationX: 0, rotationY: 0 }, 15.5);
      timeline.to(camera, { z: -380, rotationX: 5, rotationY: -8 }, 16.6)
        .to(archive, { autoAlpha: .5, scale: 1.4, rotationY: 0 }, 16.6)
        .to([business, document, rule, evidence, trust], { scale: .2, autoAlpha: .35 }, 16.6)
        .to(workspace, { autoAlpha: .25, scale: .28 }, 16.6)
        .to({}, { duration: .5 }, DURATION - .5);

      const enter = gsap.timeline();
      enter.from(".film-hero-copy .hero-line-text", { yPercent: 110, stagger: .12, duration: 1, ease: "power3.out" })
        .from(".film-hero-copy > p, .film-hero-actions", { autoAlpha: 0, y: 15, stagger: .1, duration: .7 }, .45)
        .from(".film-world", { autoAlpha: 0, duration: 1 }, .2);

      if (window.matchMedia("(pointer: fine)").matches) {
        const rx = gsap.quickTo(pointerRig, "rotationY", { duration: 1.2, ease: "power3.out" });
        const ry = gsap.quickTo(pointerRig, "rotationX", { duration: 1.2, ease: "power3.out" });
        const px = gsap.quickTo(pointerRig, "x", { duration: 1.2, ease: "power3.out" });
        const move = (event: PointerEvent) => {
          if (timeline.time() > 1.5) return;
          const bounds = root.querySelector(".film-stage")!.getBoundingClientRect();
          const x = event.clientX / bounds.width - .5, y = event.clientY / bounds.height - .5;
          rx(x * 3); ry(-y * 2); px(x * 12);
        };
        const reset = () => { rx(0); ry(0); px(0); };
        root.addEventListener("pointermove", move, { passive: true }); root.addEventListener("pointerleave", reset);
        detachPointer = () => { root.removeEventListener("pointermove", move); root.removeEventListener("pointerleave", reset); };
      }
      const ambient = gsap.to(".film-ambient", { x: 8, y: -6, scale: 1.015, duration: 16, repeat: -1, yoyo: true, ease: "sine.inOut" });
      let stageVisible = true;
      const pauseAmbient = () => ambient.paused(!stageVisible || window.document.hidden);
      const observer = new IntersectionObserver(([entry]) => { stageVisible = entry.isIntersecting; pauseAmbient(); });
      observer.observe(root.querySelector(".film-stage")!);
      window.document.addEventListener("visibilitychange", pauseAmbient);
      detachAmbient = () => { observer.disconnect(); window.document.removeEventListener("visibilitychange", pauseAmbient); };
      // Font metrics influence semantic word trajectories; refresh once ready.
      void documentFontsReady();
      async function documentFontsReady() { await window.document.fonts.ready; if (root.isConnected) ScrollTrigger.refresh(); }
    }, root);
    return () => { detachPointer(); detachAmbient(); ctx.revert(); triggerRef.current = null; };
  }, [cinematic]);

  const goToPhase = (index: number) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const top = index >= DURATION ? trigger.end + window.innerHeight : trigger.start + ((index + .25) / DURATION) * (trigger.end - trigger.start);
    window.scrollTo({ top, behavior: "instant" });
  };
  const scrollTab: WorkspaceTab = phase < 12 ? "compliance" : phase === 12 ? "documents" : phase === 13 ? "workflows" : phase === 14 ? "calendar" : phase === 15 ? standardsView ? "standards" : "schemes" : "compliance";

  if (!cinematic) return <div ref={rootRef}><StaticStory /></div>;
  return <div ref={rootRef} id="hero" className="product-film" data-phase={phase}>
    {[["story", 1], ["question", 4], ["discovery", 5], ["source", 6], ["mechanism", 7], ["evidence", 9], ["workspace", 11], ["principle", 16]].map(([id, at]) => <div key={id} id={String(id)} className="film-scroll-marker" style={{ top: `${SCROLL_DISTANCE * (Number(at) + .25) / DURATION}vh` }} aria-hidden="true" />)}
    <div className="film-stage">
      <div className="film-ambient bg-grain" aria-hidden="true" />
      <div className="film-topline film-mono"><span>COMPLYWISE / A BUSINESS IN CONTEXT</span><span>AN ILLUSTRATIVE PRODUCT STORY</span></div>
      <div className="film-editorial">{chapters.map((_, i) => <ChapterCopy index={i} key={i} cinematic active={phase === i} />)}</div>
      <div className="film-world"><div className="film-pointer-rig"><div className="film-camera">
        <div className="world-object film-business" data-world-object="business" inert={phase > 3} aria-hidden={phase > 3}><Dossier /></div>
        <div className="world-object film-question" data-world-object="question" inert={phase !== 4} aria-hidden={phase !== 4}><Question /></div>
        <div className="world-object film-archive" data-world-object="archive" inert={phase !== 5} aria-hidden={phase !== 5}><Archive /></div>
        <div className="world-object film-document" data-world-object="document" aria-hidden={phase !== 6}><Document /></div>
        <div className="world-object film-rule" data-world-object="clause-rule" aria-hidden={phase < 7 || phase > 8}><Rule /></div>
        <div className="world-object film-evidence" data-world-object="evidence" inert={phase !== 9} aria-hidden={phase !== 9}><Evidence /></div>
        <div className={`world-object film-workspace ${phase >= 11 && phase <= 15 ? "is-workspace" : ""}`} data-world-object="workspace" inert={phase < 11 || phase > 15} aria-hidden={phase < 11 || phase > 15}><WorkspaceStoryScene embedded scrollTab={scrollTab} taskSlot={<DecisionTask />} /></div>
        <div className="world-object film-trust" data-world-object="trust" aria-hidden={phase !== 16}><TrustChain /></div>
      </div></div></div>
      <div className="film-bottomline"><span className="film-mono">{String(phase + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}</span><div className="film-progress" aria-hidden="true">{chapters.map((_, i) => <i key={i} className={i <= phase ? "is-active" : ""} />)}</div><button onClick={() => goToPhase(phase + 1)} className="film-next film-mono">{phase === 17 ? "EXPLORE BELOW" : "NEXT CHAPTER"}<ArrowDown size={14} /></button></div>
    </div>
  </div>;
}
