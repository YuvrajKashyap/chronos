"use client";

import { Check, X } from "lucide-react";
import { useFormStatus } from "react-dom";

export function TimerDecisionButton({
  decision,
}: {
  decision: "count" | "skip";
}) {
  const { pending } = useFormStatus();
  const Icon = decision === "count" ? Check : X;
  const label = decision === "count" ? "Count it" : "Skip it";
  const pendingLabel = decision === "count" ? "Counting" : "Skipping";

  return (
    <button className={`session-decision-button ${decision === "count" ? "is-count" : "is-skip"}`} type="submit" disabled={pending}>
      <Icon size={18} strokeWidth={2.4} aria-hidden="true" />
      <span>{pending ? pendingLabel : label}</span>
    </button>
  );
}
