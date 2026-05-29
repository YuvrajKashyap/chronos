"use client";

import { useEffect, useRef, useState } from "react";

import { formatSecondsAsTimer } from "@/lib/chronos/format-time";

type LiveTimerValueProps = {
  className?: string;
  initialSeconds?: number;
  startedAt?: string;
};

function getElapsedSeconds(startedAt: string | undefined, fallbackSeconds: number, fallbackStartedAtMs: number) {
  if (!startedAt) {
    return Math.max(0, fallbackSeconds + Math.floor((Date.now() - fallbackStartedAtMs) / 1000));
  }

  const startedAtMs = new Date(startedAt).getTime();

  if (Number.isNaN(startedAtMs)) {
    return Math.max(0, fallbackSeconds + Math.floor((Date.now() - fallbackStartedAtMs) / 1000));
  }

  return Math.max(fallbackSeconds, Math.floor((Date.now() - startedAtMs) / 1000));
}

export function LiveTimerValue({ className, initialSeconds = 0, startedAt }: LiveTimerValueProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const fallbackStartedAtMsRef = useRef(Date.now());

  useEffect(() => {
    fallbackStartedAtMsRef.current = Date.now();
    setSeconds(getElapsedSeconds(startedAt, initialSeconds, fallbackStartedAtMsRef.current));

    const intervalId = window.setInterval(() => {
      setSeconds(getElapsedSeconds(startedAt, initialSeconds, fallbackStartedAtMsRef.current));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [initialSeconds, startedAt]);

  return <div className={className}>{formatSecondsAsTimer(seconds)}</div>;
}
