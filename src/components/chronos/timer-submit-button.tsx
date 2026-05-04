"use client";

import { Play, Square } from "lucide-react";
import { useFormStatus } from "react-dom";

export function TimerSubmitButton({
  buttonLabel,
  disabled = false,
}: {
  buttonLabel: "Start" | "Stop";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const ButtonIcon = buttonLabel === "Stop" ? Square : Play;
  const label = pending ? (buttonLabel === "Stop" ? "Stopping" : "Starting") : buttonLabel;

  return (
    <button className="timer-button" type="submit" disabled={pending || disabled}>
      <ButtonIcon size={22} fill="currentColor" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
