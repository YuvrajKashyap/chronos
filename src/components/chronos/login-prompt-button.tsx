"use client";

import Link from "next/link";
import { Play, Square } from "lucide-react";

export function LoginPromptButton({ buttonLabel }: { buttonLabel: "Start" | "Stop" }) {
  const ButtonIcon = buttonLabel === "Stop" ? Square : Play;

  return (
    <Link className="timer-button" href="/login" aria-label={`${buttonLabel} timer after admin login`}>
      <ButtonIcon size={22} fill="currentColor" aria-hidden="true" />
      <span>{buttonLabel}</span>
    </Link>
  );
}
