"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function SkillModal({
  children,
  eyebrow,
  onClose,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  onClose: () => void;
  title: string;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div className="skill-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="skill-modal-panel" role="dialog" aria-modal="true" aria-labelledby="skill-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="skill-modal-close" type="button" onClick={onClose} aria-label="Close">
          <X size={18} aria-hidden="true" />
        </button>
        <header className="skill-modal-header">
          <p className="skill-modal-kicker">{eyebrow}</p>
          <h2 id="skill-modal-title">{title}</h2>
        </header>
        <div className="skill-modal-content">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
