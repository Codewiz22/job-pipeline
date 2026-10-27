"use client";
// ui.js
// Small building blocks: company logo, copy button, score pill, modal shell.

import { useEffect, useState } from "react";
import { initials, scoreTone } from "../lib/format";

export function Logo({ src, name, size = 44 }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (!src || failed) {
    return <div className="logo logo-fallback" style={style} aria-hidden="true">{initials(name)}</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="logo" style={style} src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}

export function ScorePill({ score, large = false }) {
  return (
    <span className={`score score-${scoreTone(score)} ${large ? "score-lg" : ""}`} title={`Match score ${score} out of 100`}>
      {score}
    </span>
  );
}

export function CopyButton({ text, label = "Copy", className = "" }) {
  const [copied, setCopied] = useState(false);
  async function copy(e) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API blocked: fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }
  return (
    <button type="button" className={`btn btn-ghost btn-sm ${className}`} onClick={copy} disabled={!text}>
      {copied ? "Copied" : label}
    </button>
  );
}

export function Modal({ onClose, children, wide = false, label }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
