"use client";

import { Check, Loader2, Pause, Play, Square, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import type {
  confirmChronosTimerSessionSmooth,
  SmoothStoppedSession,
  startChronosTimerSmooth,
  stopChronosTimerSmooth,
} from "@/app/admin/actions";
import { formatSecondsAsTimer } from "@/lib/chronos/format-time";

const timerStartedEvent = "chronos:timer-started";
const timerStoppedEvent = "chronos:timer-stopped";

type TimerMode = "idle" | "running" | "paused";

type TimerCardRuntimeProps = {
  activeStartedAt?: string;
  buttonLabel: "Start" | "Stop";
  confirmAction: typeof confirmChronosTimerSessionSmooth;
  disabled?: boolean;
  initialElapsedSeconds?: number;
  initialIsActive: boolean;
  label: string;
  skillId: string;
  skillName: string;
  startAction: typeof startChronosTimerSmooth;
  stopAction: typeof stopChronosTimerSmooth;
  value: string;
};

function getInitialElapsedSeconds(startedAt: string | undefined, fallbackSeconds: number) {
  if (!startedAt) {
    return fallbackSeconds;
  }

  const startedAtMs = new Date(startedAt).getTime();
  if (Number.isNaN(startedAtMs)) {
    return fallbackSeconds;
  }

  return Math.max(fallbackSeconds, Math.floor((Date.now() - startedAtMs) / 1000));
}

function getStoppedAtIso(startedAtMs: number | null, elapsedSeconds: number) {
  if (!startedAtMs) {
    return new Date().toISOString();
  }

  return new Date(startedAtMs + (Math.max(0, elapsedSeconds) * 1000)).toISOString();
}

function splitDurationSeconds(durationSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(durationSeconds));

  return {
    hours: Math.floor(safeSeconds / 3600),
    minutes: Math.floor((safeSeconds % 3600) / 60),
    seconds: safeSeconds % 60,
  };
}

function getDurationInputValue(value: string, max?: number) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  const bounded = Math.max(0, parsed);
  return typeof max === "number" ? Math.min(max, bounded) : bounded;
}

export function TimerCardRuntime({
  activeStartedAt,
  buttonLabel,
  confirmAction,
  disabled = false,
  initialElapsedSeconds = 0,
  initialIsActive,
  label,
  skillId,
  skillName,
  startAction,
  stopAction,
  value,
}: TimerCardRuntimeProps) {
  const [mode, setMode] = useState<TimerMode>(initialIsActive ? "running" : "idle");
  const [seconds, setSeconds] = useState(() => getInitialElapsedSeconds(activeStartedAt, initialElapsedSeconds));
  const [error, setError] = useState<string | null>(null);
  const [isSyncingStart, setIsSyncingStart] = useState(false);
  const [isSyncingStop, setIsSyncingStop] = useState(false);
  const [externalActiveSkillId, setExternalActiveSkillId] = useState<string | null>(initialIsActive ? skillId : null);
  const activeStartedAtMsRef = useRef<number | null>(activeStartedAt ? new Date(activeStartedAt).getTime() : null);
  const runStartedAtMsRef = useRef<number | null>(activeStartedAt ? new Date(activeStartedAt).getTime() : null);
  const accumulatedSecondsRef = useRef(0);
  const startPromiseRef = useRef<Promise<Awaited<ReturnType<typeof startAction>>> | null>(null);
  const hasActiveTimer = mode === "running" || mode === "paused";
  const startDisabled = disabled || Boolean(externalActiveSkillId && externalActiveSkillId !== skillId);

  useEffect(() => {
    function onTimerStarted(event: Event) {
      const nextSkillId = (event as CustomEvent<{ skillId: string }>).detail?.skillId;
      setExternalActiveSkillId(nextSkillId ?? null);
    }

    function onTimerStopped() {
      setExternalActiveSkillId(null);
    }

    window.addEventListener(timerStartedEvent, onTimerStarted);
    window.addEventListener(timerStoppedEvent, onTimerStopped);

    return () => {
      window.removeEventListener(timerStartedEvent, onTimerStarted);
      window.removeEventListener(timerStoppedEvent, onTimerStopped);
    };
  }, []);

  useEffect(() => {
    if (mode !== "running") {
      return;
    }

    function tick() {
      const runStartedAtMs = runStartedAtMsRef.current ?? Date.now();
      const nextSeconds = accumulatedSecondsRef.current + Math.floor((Date.now() - runStartedAtMs) / 1000);
      setSeconds(Math.max(0, nextSeconds));
    }

    tick();
    const intervalId = window.setInterval(tick, 250);

    return () => window.clearInterval(intervalId);
  }, [mode]);

  function startLocalTimer() {
    if (startDisabled || hasActiveTimer || isSyncingStart) {
      return;
    }

    const startedAtMs = Date.now();
    const startedAt = new Date(startedAtMs).toISOString();

    setError(null);
    setSeconds(0);
    setMode("running");
    setIsSyncingStart(true);
    setExternalActiveSkillId(skillId);
    activeStartedAtMsRef.current = startedAtMs;
    runStartedAtMsRef.current = startedAtMs;
    accumulatedSecondsRef.current = 0;
    window.dispatchEvent(new CustomEvent(timerStartedEvent, { detail: { skillId } }));

    const promise = startAction(skillId, startedAt);
    startPromiseRef.current = promise;
    promise
      .then((result) => {
        if (!result.success) {
          setError(result.error);
          setMode("idle");
          setExternalActiveSkillId(null);
          window.dispatchEvent(new Event(timerStoppedEvent));
        }
      })
      .finally(() => {
        setIsSyncingStart(false);
      });
  }

  function pauseTimer() {
    if (mode !== "running") {
      return;
    }

    const runStartedAtMs = runStartedAtMsRef.current ?? Date.now();
    const nextSeconds = accumulatedSecondsRef.current + Math.floor((Date.now() - runStartedAtMs) / 1000);
    accumulatedSecondsRef.current = Math.max(0, nextSeconds);
    setSeconds(accumulatedSecondsRef.current);
    setMode("paused");
  }

  function resumeTimer() {
    if (mode !== "paused") {
      return;
    }

    runStartedAtMsRef.current = Date.now();
    setMode("running");
  }

  async function stopLocalTimer() {
    if (!hasActiveTimer || isSyncingStop) {
      return undefined;
    }

    const visibleSeconds =
      mode === "running"
        ? accumulatedSecondsRef.current + Math.floor((Date.now() - (runStartedAtMsRef.current ?? Date.now())) / 1000)
        : seconds;
    const finalSeconds = Math.max(0, visibleSeconds);
    const endedAt = getStoppedAtIso(activeStartedAtMsRef.current, finalSeconds);

    setError(null);
    setSeconds(finalSeconds);
    setMode("idle");
    setIsSyncingStop(true);
    setExternalActiveSkillId(null);
    window.dispatchEvent(new Event(timerStoppedEvent));

    if (startPromiseRef.current) {
      const startResult = await startPromiseRef.current;
      if (!startResult.success) {
        setError(startResult.error);
        setIsSyncingStop(false);
        return undefined;
      }
    }

    const result = await stopAction(skillName, endedAt);
    setIsSyncingStop(false);

    if (!result.success) {
      setError(result.error);
      return undefined;
    }

    return result.session;
  }

  return (
    <>
      <div className="card-header-live-slot">
        {hasActiveTimer ? (
          <span className="live-badge">
            <span aria-hidden="true" />
            {mode === "paused" ? "PAUSED" : "LIVE"}
          </span>
        ) : null}
      </div>
      <div className="card-body">
        <h2>{skillName}</h2>
        {!hasActiveTimer ? <p className="metric-label">{label}</p> : null}
        <div className={hasActiveTimer || isSyncingStop ? "metric-value active-value" : "metric-value"}>
          {hasActiveTimer || isSyncingStop ? formatSecondsAsTimer(seconds) : value}
        </div>
        {hasActiveTimer ? <p className="metric-label">{mode === "paused" ? "PAUSED" : "ELAPSED TIME"}</p> : null}
      </div>
      <div className="card-rule" aria-hidden="true" />
      <SmoothTimerControl
        buttonLabel={hasActiveTimer ? "Stop" : buttonLabel}
        confirmAction={confirmAction}
        disabled={startDisabled}
        isPaused={mode === "paused"}
        isSyncingStart={isSyncingStart}
        isSyncingStop={isSyncingStop}
        skillName={skillName}
        stopPreviewSeconds={seconds}
        onPause={pauseTimer}
        onResume={resumeTimer}
        onStart={startLocalTimer}
        onStop={stopLocalTimer}
      />
      {error ? <p className="smooth-timer-error">{error}</p> : null}
    </>
  );
}

type SmoothTimerControlProps = {
  buttonLabel: "Start" | "Stop";
  confirmAction: typeof confirmChronosTimerSessionSmooth;
  disabled?: boolean;
  isPaused?: boolean;
  isSyncingStart?: boolean;
  isSyncingStop?: boolean;
  skillName: string;
  stopPreviewSeconds?: number;
  onPause?: () => void;
  onResume?: () => void;
  onStart?: () => void;
  onStop?: () => Promise<SmoothStoppedSession | undefined>;
};

export function SmoothTimerControl({
  buttonLabel,
  confirmAction,
  disabled = false,
  isPaused = false,
  isSyncingStart = false,
  isSyncingStop = false,
  skillName,
  stopPreviewSeconds = 0,
  onPause,
  onResume,
  onStart,
  onStop,
}: SmoothTimerControlProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stoppedSession, setStoppedSession] = useState<SmoothStoppedSession | null>(null);
  const [decisionPending, setDecisionPending] = useState<"count" | "skip" | null>(null);
  const isStop = buttonLabel === "Stop";
  const isBusy = isSyncingStart || isSyncingStop || isPending;
  const ButtonIcon = isSyncingStart || isSyncingStop ? Loader2 : isStop ? Square : Play;
  const label = isSyncingStart ? "Starting" : isSyncingStop ? "Stopping" : isStop ? "Stop now" : buttonLabel;

  function handleTimerClick() {
    if (disabled || isBusy) {
      return;
    }

    setError(null);
    if (!isStop) {
      onStart?.();
      return;
    }

    setStoppedSession({
      id: "",
      skillId: "",
      skillName,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: stopPreviewSeconds,
    });
    startTransition(async () => {
      const session = await onStop?.();
      if (!session) {
        setStoppedSession(null);
        return;
      }

      setStoppedSession(session);
    });
  }

  function handlePauseClick() {
    if (isPaused) {
      onResume?.();
      return;
    }

    onPause?.();
  }

  function handleDecision(countTowardsLifetime: boolean, durationSeconds?: number) {
    if (!stoppedSession || decisionPending || !stoppedSession.id) {
      return;
    }

    const decision = countTowardsLifetime ? "count" : "skip";
    setDecisionPending(decision);
    setError(null);
    startTransition(async () => {
      const result = await confirmAction(stoppedSession.id, countTowardsLifetime, durationSeconds);

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
      <div className={isStop ? "timer-motion-shell timer-active-controls" : "timer-motion-shell"}>
        {isStop ? (
          <button className="timer-button timer-pause-button" type="button" disabled={isBusy} onClick={handlePauseClick}>
            {isPaused ? <Play size={22} fill="currentColor" aria-hidden="true" /> : <Pause size={22} fill="currentColor" aria-hidden="true" />}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </button>
        ) : null}
        <button
          className={`timer-button ${isBusy ? "is-busy" : ""}`}
          type="button"
          disabled={disabled || isBusy}
          onClick={handleTimerClick}
        >
          <ButtonIcon
            className={isSyncingStart || isSyncingStop ? "timer-button-spinner" : undefined}
            size={22}
            fill={isSyncingStart || isSyncingStop ? "none" : "currentColor"}
            aria-hidden="true"
          />
          <span>{label}</span>
        </button>
      </div>
      {error ? <p className="smooth-timer-error">{error}</p> : null}
      {stoppedSession ? (
        <LifetimeDecisionModal
          decisionPending={decisionPending}
          error={error}
          isSyncing={!stoppedSession.id || isSyncingStop}
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
  isSyncing?: boolean;
  session: SmoothStoppedSession;
  onDecision: (countTowardsLifetime: boolean, durationSeconds?: number) => void;
};

export function LifetimeDecisionModal({
  decisionPending,
  error,
  isSyncing = false,
  session,
  onDecision,
}: LifetimeDecisionModalProps) {
  const initialParts = useMemo(() => splitDurationSeconds(session.durationSeconds), [session.durationSeconds]);
  const [mounted, setMounted] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [hours, setHours] = useState(String(initialParts.hours));
  const [minutes, setMinutes] = useState(String(initialParts.minutes));
  const [seconds, setSeconds] = useState(String(initialParts.seconds));
  const editedDurationSeconds =
    (getDurationInputValue(hours) * 3600) + (getDurationInputValue(minutes, 59) * 60) + getDurationInputValue(seconds, 59);
  const hasEditedDuration = editedDurationSeconds !== Math.max(0, Math.floor(session.durationSeconds));
  const duration = useMemo(() => formatSecondsAsTimer(editedDurationSeconds), [editedDurationSeconds]);
  const submittedDurationSeconds = hasEditedDuration ? editedDurationSeconds : undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const nextParts = splitDurationSeconds(session.durationSeconds);
    setHours(String(nextParts.hours));
    setMinutes(String(nextParts.minutes));
    setSeconds(String(nextParts.seconds));
    setIsEditingDuration(false);
  }, [session.id, session.durationSeconds]);

  const modal = (
    <div className="lifetime-decision-backdrop" role="presentation">
      <section className="lifetime-decision-panel" role="dialog" aria-modal="true" aria-labelledby="lifetime-decision-title">
        <div className="lifetime-decision-aura" aria-hidden="true" />
        <div className="lifetime-decision-topline">
          <p className="lifetime-decision-kicker">Stopped timer</p>
          <span className="lifetime-decision-skill">{session.skillName}</span>
        </div>
        <h2 id="lifetime-decision-title">Count this toward lifetime?</h2>
        <div className="lifetime-decision-time-card">
          <span>Elapsed</span>
          {isEditingDuration ? (
            <div className="lifetime-duration-inputs" aria-label="Edit elapsed duration">
              <label>
                <span>Hours</span>
                <input
                  inputMode="numeric"
                  min="0"
                  type="number"
                  value={hours}
                  onChange={(event) => setHours(event.target.value)}
                />
              </label>
              <label>
                <span>Min</span>
                <input
                  inputMode="numeric"
                  max="59"
                  min="0"
                  type="number"
                  value={minutes}
                  onChange={(event) => setMinutes(event.target.value)}
                />
              </label>
              <label>
                <span>Sec</span>
                <input
                  inputMode="numeric"
                  max="59"
                  min="0"
                  type="number"
                  value={seconds}
                  onChange={(event) => setSeconds(event.target.value)}
                />
              </label>
            </div>
          ) : (
            <button className="lifetime-duration-button" type="button" onClick={() => setIsEditingDuration(true)}>
              <strong>{duration}</strong>
            </button>
          )}
        </div>
        <p>Lifetime totals stay unchanged until you choose.</p>
        {error ? <p className="lifetime-decision-error">{error}</p> : null}
        {isSyncing ? <p className="lifetime-decision-sync">Finalizing the stopped session...</p> : null}
        <div className="lifetime-decision-actions">
          <button
            className="session-decision-button is-skip"
            type="button"
            disabled={Boolean(decisionPending) || isSyncing}
            onClick={() => onDecision(false, submittedDurationSeconds)}
          >
            {decisionPending === "skip" ? <Loader2 className="timer-button-spinner" size={18} /> : <X size={18} />}
            <span>{decisionPending === "skip" ? "Skipping" : "Skip it"}</span>
          </button>
          <button
            className="session-decision-button is-count"
            type="button"
            disabled={Boolean(decisionPending) || isSyncing}
            onClick={() => onDecision(true, submittedDurationSeconds)}
          >
            {decisionPending === "count" ? <Loader2 className="timer-button-spinner" size={18} /> : <Check size={18} />}
            <span>{decisionPending === "count" ? "Counting" : "Count it"}</span>
          </button>
        </div>
      </section>
    </div>
  );

  return mounted ? createPortal(modal, document.body) : null;
}
