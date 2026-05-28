"use client";

import Link from "next/link";
import { Play, Square, X } from "lucide-react";
import { useState } from "react";

export function LoginPromptButton({ buttonLabel }: { buttonLabel: "Start" | "Stop" }) {
  const [isOpen, setIsOpen] = useState(false);
  const ButtonIcon = buttonLabel === "Stop" ? Square : Play;

  return (
    <>
      <button className="timer-button" type="button" onClick={() => setIsOpen(true)}>
        <ButtonIcon size={22} fill="currentColor" aria-hidden="true" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen ? (
        <div className="login-modal-backdrop" role="presentation" onClick={() => setIsOpen(false)}>
          <section
            className="login-modal"
            aria-labelledby="login-modal-title"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="login-modal-close" type="button" aria-label="Close login prompt" onClick={() => setIsOpen(false)}>
              <X size={18} aria-hidden="true" />
            </button>
            <p className="auth-kicker">Private control</p>
            <h2 id="login-modal-title">Login Required</h2>
            <p>Public visitors can view Chronos. Timer controls unlock only for the owner.</p>
            <Link className="auth-primary-link" href="/login">
              Admin login
            </Link>
          </section>
        </div>
      ) : null}
    </>
  );
}
