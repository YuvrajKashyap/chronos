"use client";

import { Check, Loader2, Play, Sparkles, Square, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import type {
  confirmChronosTimerSessionSmooth,
  SmoothStoppedSession,
  startChronosTimerSmooth,
  stopChronosTimerSmooth,
} from "@/app/admin/actions";
import { formatSecondsAsTimer } from "@/lib/chronos/format-time";

type SmoothTimerControlProps = {
  buttonLabel: "Start" | "Stop";
  confirmAction: typeof confirmChronosTimerSessionSmooth;
  disabled?: boolean;
  skillId: string;
  skillName: string;
  startAction: typeof startChronosTimerSmooth;
  stopAction: typeof stopChronosTimerSmooth;
};

export function SmoothTimerControl({
  buttonLabel,
  confirmAction,
  disabled = false,
  skillId,
  skillName,
  startAction,
  stopAction,
}: SmoothTimerControlProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [phase, setPhase] = useState<"idle" | "starting" | "stopping">("idle");
  const [error, setError] = useState<string | null>(null);
  const [stoppedSession, setStoppedSession] = useState<SmoothStoppedSession | null>(null);
  const [decisionPending, setDecisionPending] = useState<"count" | "skip" | null>(null);
  const isStop = buttonLabel === "Stop";
  const isBusy = phase !== "idle" || isPending;
  const ButtonIcon = phase === "idle" ? (isStop ? Square : Play) : Loader2;
  const label = phase === "starting" ? "Starting" : phase === "stopping" ? "Stopping" : buttonLabel;

  function handleTimerClick() {
    if (disabled || isBusy) {
      return;
    }

    setError(null);
    setPhase(isStop ? "stopping" : "starting");
    startTransition(async () => {
      if (isStop) {
        const result = await stopAction(skillName);

        if (!result.success) {
          setError(result.error);
          setPhase("idle");
          return;
        }

        setStoppedSession(result.session);
        setPhase("idle");
        router.refresh();
        return;
      }

      const result = await startAction(skillId);
      if (!result.success) {
        setError(result.error);
        setPhase("idle");
        return;
      }

      setPhase("idle");
      router.refresh();
    });
  }

  function handleDecision(countTowardsLifetime: boolean) {
    if (!stoppedSession || decisionPending) {
      return;
    }

    const decision = countTowardsLifetime ? "count" : "skip";
    setDecisionPending(decision);
    setError(null);
    startTransition(async () => {
      const result = await confirmAction(stoppedSession.id, countTowardsLifetime);

      if (!result.success) {
        setError(result.error);
        setDecisionPending(null);
        return;
      }

      setStoppedSession(null);
      setDecisionPending(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="timer-motion-shell">
        <button
          className={`timer-button ${isBusy ? "is-busy" : ""}`}
          type="button"
          disabled={disabled || isBusy}
          onClick={handleTimerClick}
        >
          <ButtonIcon
            className={phase === "idle" ? undefined : "timer-button-spinner"}
            size={22}
            fill={phase === "idle" ? "currentColor" : "none"}
            aria-hidden="true"
          />
          <span>{label}</span>
        </button>
        {phase !== "idle" ? (
          <span className="timer-motion-pulse" aria-hidden="true">
            <Sparkles size={15} />
          </span>
        ) : null}
      </div>
      {error ? <p className="smooth-timer-error">{error}</p> : null}
      {stoppedSession ? (
        <LifetimeDecisionModal
          decisionPending={decisionPending}
          error={error}
          session={stoppedSession}
          onDecision={handleDecision}
        />
      ) : null}
    </>
  );
}

type LifetimeDecisionModalProps = {
  decisionPending: "count" | "skip" | null;
  error: string | null;
  session: SmoothStoppedSession;
  onDecision: (countTowardsLifetime: boolean) => void;
};

export function LifetimeDecisionModal({
  decisionPending,
  error,
  session,
  onDecision,
}: LifetimeDecisionModalProps) {
  const duration = useMemo(() => formatSecondsAsTimer(session.durationSeconds), [session.durationSeconds]);

  return (
    <div className="lifetime-decision-backdrop" role="presentation">
      <section className="lifetime-decision-panel" role="dialog" aria-modal="true" aria-labelledby="lifetime-decision-title">
        <div className="lifetime-decision-aura" aria-hidden="true" />
        <p className="lifetime-decision-kicker">Stopped timer</p>
        <h2 id="lifetime-decision-title">Count this toward lifetime?</h2>
        <div className="lifetime-decision-session">
          <span>{session.skillName}</span>
          <strong>{duration}</strong>
        </div>
        <p>
          Lifetime totals stay unchanged until you choose. Counting adds this session to the dashboard total; skipping leaves
          it out.
        </p>
        {error ? <p className="lifetime-decision-error">{error}</p> : null}
        <div className="lifetime-decision-actions">
          <button
            className="session-decision-button is-skip"
            type="button"
            disabled={Boolean(decisionPending)}
            onClick={() => onDecision(false)}
          >
            {decisionPending === "skip" ? <Loader2 className="timer-button-spinner" size={18} /> : <X size={18} />}
            <span>{decisionPending === "skip" ? "Skipping" : "Skip it"}</span>
          </button>
          <button
            className="session-decision-button is-count"
            type="button"
            disabled={Boolean(decisionPending)}
            onClick={() => onDecision(true)}
          >
            {decisionPending === "count" ? <Loader2 className="timer-button-spinner" size={18} /> : <Check size={18} />}
            <span>{decisionPending === "count" ? "Counting" : "Count it"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
