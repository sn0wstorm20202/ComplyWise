"use client";

import React, { useState, useEffect, useRef } from "react";

const ORBIT_NODES = [
  { label: "STANDARD", code: "IS 3055:2024", angle: 0, color: "#60A5FA", glow: "rgba(96,165,250,0.2)" },
  { label: "CLAUSE", code: "Cl. 4.1", angle: 60, color: "#A78BFA", glow: "rgba(167,139,250,0.2)" },
  { label: "REQUIREMENT", code: "REQ-04", angle: 120, color: "#F59E0B", glow: "rgba(245,158,11,0.2)" },
  { label: "EVIDENCE", code: "NABL-2026", angle: 180, color: "#34D399", glow: "rgba(52,211,153,0.2)" },
  { label: "SOURCE", code: "Gazette S.O.", angle: 240, color: "#38BDF8", glow: "rgba(56,189,248,0.2)" },
  { label: "ACTION", code: "ISI Filing", angle: 300, color: "#FB7185", glow: "rgba(251,113,133,0.2)" },
];

export function ComplianceIntelligenceCore() {
  const [mounted, setMounted] = useState(false);
  const [activeNode, setActiveNode] = useState(0);
  const startTime = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    setMounted(true);
    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current > 50) { // ~20fps throttled
        setElapsed((Date.now() - startTime.current) / 1000);
        lastUpdateRef.current = timestamp;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode((n) => (n + 1) % ORBIT_NODES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const t = mounted ? elapsed : 0;
  const ORBIT_R = 142;

  return (
    <div
      className="relative select-none"
      style={{ width: 420, height: 420, maxWidth: "100%" }}
    >
      {/* ── Outer slow orbit ring ── */}
      <div
        className="absolute pointer-events-none border border-white/[0.05] rounded-full animate-orbit-slow"
        style={{ width: 390, height: 390, left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 1,
              height: 4,
              background: "rgba(255,255,255,0.06)",
              left: "50%",
              top: 0,
              transformOrigin: "50% 195px",
              transform: `translateX(-50%) rotate(${i * 45}deg)`,
            }}
          />
        ))}
      </div>

      {/* ── Mid counter-rotating dashed ring ── */}
      <div
        className="absolute pointer-events-none rounded-full animate-orbit-reverse"
        style={{
          width: 310,
          height: 310,
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          border: "1px dashed rgba(96,165,250,0.08)",
        }}
      />

      {/* ── Inner precision ring ── */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 240,
          height: 240,
          left: "50%",
          top: "50%",
          transform: `translate(-50%,-50%) rotate(${t * 6}deg)`,
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      />

      {/* ── Orbiting nodes ── */}
      {ORBIT_NODES.map((node, i) => {
        const angle = (node.angle + t * 9) * (Math.PI / 180);
        const x = Math.cos(angle) * ORBIT_R;
        const y = Math.sin(angle) * ORBIT_R;
        const isActive = activeNode === i;
        return (
          <div
            key={node.label}
            className="absolute flex flex-col items-center pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              zIndex: y > 0 ? 20 : 10,
            }}
          >
            {/* node dot */}
            <div
              style={{
                width: isActive ? 9 : 6,
                height: isActive ? 9 : 6,
                borderRadius: "50%",
                background: node.color,
                boxShadow: isActive ? `0 0 10px 2px ${node.glow}` : "none",
                border: "1px solid rgba(255,255,255,0.2)",
                transition: "all 0.4s ease",
                marginBottom: 3,
              }}
            />
            {/* label */}
            <div
              style={{
                fontSize: 8.5,
                fontFamily: "monospace",
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: isActive ? node.color : "rgba(160,170,185,0.55)",
                background: isActive ? "rgba(16,20,28,0.85)" : "rgba(10,14,18,0.7)",
                border: `1px solid ${isActive ? node.color + "35" : "rgba(255,255,255,0.05)"}`,
                borderRadius: 3,
                padding: "2px 4px",
                whiteSpace: "nowrap",
                transition: "all 0.4s ease",
                backdropFilter: "blur(6px)",
              }}
            >
              {node.label}
            </div>
            {isActive && (
              <div
                style={{
                  fontSize: 7.5,
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.4)",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                }}
              >
                {node.code}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Central glass core ── */}
      <div
        className="absolute smoked-glass-elevated animate-float-subtle"
        style={{
          width: 200,
          height: 200,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          zIndex: 15,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(10,14,20,0.82)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
        }}
      >
        {/* Document stack layers */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 116 + i * 8,
              height: 88 + i * 6,
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.05)",
              background: `rgba(${12 + i * 4},${16 + i * 3},${22 + i * 3},0.7)`,
              transform: `perspective(600px) rotateX(${12 - i * 4}deg) rotateY(${-3 + i * 2}deg) translateZ(${-i * 7}px) translateY(${i * 3}px)`,
              left: `calc(50% - ${(116 + i * 8) / 2}px)`,
              top: `calc(50% - ${(88 + i * 6) / 2}px)`,
              zIndex: 3 - i,
            }}
          >
            {Array.from({ length: 4 }).map((_, li) => (
              <div
                key={li}
                style={{
                  position: "absolute",
                  left: 8,
                  right: 8,
                  top: 10 + li * 14,
                  height: 1,
                  background: li === 0 ? "rgba(96,165,250,0.22)" : "rgba(255,255,255,0.04)",
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
        ))}

        {/* Central intelligence node */}
        <div
          style={{
            position: "relative",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(96,165,250,0.75) 0%, rgba(59,130,246,0.2) 60%, transparent 100%)",
              boxShadow: "0 0 12px 3px rgba(59,130,246,0.2)",
              border: "1px solid rgba(96,165,250,0.4)",
            }}
          />
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 8.5,
              fontWeight: 700,
              color: "rgba(255,255,255,0.85)",
              letterSpacing: "0.08em",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            COMPLIANCE<br />INTELLIGENCE
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 7.5,
              color: "rgba(96,165,250,0.65)",
            }}
          >
            v2.6 · DETERMINISTIC
          </div>
        </div>
      </div>

      {/* ── Subtle status bar ── */}
      <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center pointer-events-none">
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 8,
            color: "rgba(52,211,153,0.5)",
            letterSpacing: "0.08em",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#34D399",
              display: "inline-block",
            }}
          />
          REGULATORY GRAPH RESOLVED
        </div>
      </div>
    </div>
  );
}

export default ComplianceIntelligenceCore;
