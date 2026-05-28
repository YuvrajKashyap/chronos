"use client";

import { useEffect, useState } from "react";

import { formatSecondsAsTimer } from "@/lib/chronos/format-time";

type LiveTimerValueProps = {
  className?: string;
  initialSeconds?: number;
  startedAt?: string;
};

function getElapsedSeconds(startedAt: string | undefined, fallbackSeconds: number) {
  if (!startedAt) {
    return fallbackSeconds;
  }

  const startedAtMs = new Date(startedAt).getTime();

  if (Number.isNaN(startedAtMs)) {
    return fallbackSeconds;
  }

  return Math.max(fallbackSeconds, Math.floor((Date.now() - startedAtMs) / 1000));
}

export function LiveTimerValue({ className, initialSeconds = 0, startedAt }: LiveTimerValueProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(getElapsedSeconds(startedAt, initialSeconds));

    const intervalId = window.setInterval(() => {
      setSeconds(getElapsedSeconds(startedAt, initialSeconds));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [initialSeconds, startedAt]);

  return <div className={className}>{formatSecondsAsTimer(seconds)}</div>;
}
