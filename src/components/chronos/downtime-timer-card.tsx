"use client";

import { Moon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { formatSecondsAsTimer } from "@/lib/chronos/format-time";
import { CardMotif } from "./card-motif";
import { LiveTimerValue } from "./live-timer-value";
import { timerStartedEvent, timerStoppedEvent } from "./smooth-timer-control";

type DowntimeTimerCardProps = {
  idleSession?: {
    started_at: string;
    current_idle_elapsed_seconds: number;
  } | null;
  lifetimeSeconds?: number | null;
};

function getElapsedSeconds(startedAt: string | undefined, initialSeconds: number) {
  if (!startedAt) {
    return initialSeconds;
  }

  const startedAtMs = new Date(startedAt).getTime();
  if (Number.isNaN(startedAtMs)) {
    return initialSeconds;
  }

  return Math.max(initialSeconds, Math.floor((Date.now() - startedAtMs) / 1000));
}

export function DowntimeTimerCard({ idleSession, lifetimeSeconds: initialLifetimeSeconds = 0 }: DowntimeTimerCardProps) {
  const [activeIdleSession, setActiveIdleSession] = useState(idleSession ?? null);
  const [lifetimeSeconds, setLifetimeSeconds] = useState(() => Math.max(0, Math.floor(initialLifetimeSeconds ?? 0)));
  const activeIdleSessionRef = useRef(activeIdleSession);
  const isTracking = Boolean(activeIdleSession);

  useEffect(() => {
    activeIdleSessionRef.current = activeIdleSession;
  }, [activeIdleSession]);

  useEffect(() => {
    setActiveIdleSession(idleSession ?? null);
    setLifetimeSeconds(Math.max(0, Math.floor(initialLifetimeSeconds ?? 0)));
  }, [idleSession, initialLifetimeSeconds]);

  useEffect(() => {
    function onTimerStarted() {
      const currentIdleSession = activeIdleSessionRef.current;

      if (currentIdleSession) {
        setLifetimeSeconds(
          (currentLifetimeSeconds) =>
            currentLifetimeSeconds + getElapsedSeconds(currentIdleSession.started_at, currentIdleSession.current_idle_elapsed_seconds),
        );
      }

      activeIdleSessionRef.current = null;
      setActiveIdleSession(null);
    }

    function onTimerStopped() {
      if (activeIdleSessionRef.current) {
        return;
      }

      const nextIdleSession = {
        current_idle_elapsed_seconds: 0,
        started_at: new Date().toISOString(),
      };

      activeIdleSessionRef.current = nextIdleSession;
      setActiveIdleSession(nextIdleSession);
    }

    window.addEventListener(timerStartedEvent, onTimerStarted);
    window.addEventListener(timerStoppedEvent, onTimerStopped);

    return () => {
      window.removeEventListener(timerStartedEvent, onTimerStarted);
      window.removeEventListener(timerStoppedEvent, onTimerStopped);
    };
  }, []);

  return (
    <article className={isTracking ? "skill-card downtime-card is-auto-tracking" : "skill-card downtime-card"} aria-label="Downtime auto tracker">
      <div className="card-glow" aria-hidden="true" />
      <div className="downtime-orbit" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="card-header-row downtime-header-row">
        <div className="skill-icon downtime-icon">
          <Moon size={42} strokeWidth={1.75} aria-hidden="true" />
        </div>
      </div>
      <div className="card-body downtime-body">
        <h2>Downtime</h2>
        <p className="metric-label">{isTracking ? "TRACKING NOW" : "LIFETIME DOWNTIME"}</p>
        {activeIdleSession ? (
          <>
            <LiveTimerValue
              className="metric-value active-value"
              initialSeconds={activeIdleSession.current_idle_elapsed_seconds}
              startedAt={activeIdleSession.started_at}
            />
            <p className="downtime-lifetime-total">
              <span>Lifetime total</span>
              <strong>{formatSecondsAsTimer(lifetimeSeconds)}</strong>
            </p>
          </>
        ) : (
          <div className="metric-value">{formatSecondsAsTimer(lifetimeSeconds)}</div>
        )}
      </div>
      <div className="card-rule" aria-hidden="true" />
      <CardMotif type="clouds" />
    </article>
  );
}
