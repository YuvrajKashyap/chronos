"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import type { confirmChronosTimerSessionSmooth } from "@/app/admin/actions";
import type { AdminPendingSession } from "@/lib/chronos/admin-dashboard";
import { LifetimeDecisionModal, timerSessionDecisionDismissedEvent } from "./smooth-timer-control";

function updateDismissedSessionId(current: Set<string>, sessionId: string, dismissed: boolean) {
  const next = new Set(current);

  if (dismissed) {
    next.add(sessionId);
  } else {
    next.delete(sessionId);
  }

  return next;
}

export function PendingSessionReview({
  action,
  sessions,
}: {
  action: typeof confirmChronosTimerSessionSmooth;
  sessions: AdminPendingSession[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [decisionPending, setDecisionPending] = useState<"count" | "skip" | null>(null);
  const [dismissedSessionIds, setDismissedSessionIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    function onSessionDecisionDismissed(event: Event) {
      const detail = (event as CustomEvent<{ dismissed?: boolean; sessionId?: string }>).detail;
      if (!detail?.sessionId) {
        return;
      }

      setDismissedSessionIds((current) => updateDismissedSessionId(current, detail.sessionId!, detail.dismissed !== false));
    }

    window.addEventListener(timerSessionDecisionDismissedEvent, onSessionDecisionDismissed);
    return () => window.removeEventListener(timerSessionDecisionDismissedEvent, onSessionDecisionDismissed);
  }, []);

  const session = sessions.find((candidate) => !dismissedSessionIds.has(candidate.id)) ?? null;
  const modalSession = useMemo(() => {
    if (!session) {
      return null;
    }

    return {
      id: session.id,
      skillId: session.skill_id,
      skillName: session.skill_name,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      durationSeconds: session.duration_seconds,
    };
  }, [session]);

  if (sessions.length === 0) {
    return null;
  }

  if (!modalSession) {
    return null;
  }

  function handleDecision(countTowardsLifetime: boolean, durationSeconds?: number) {
    if (!modalSession || isPending) {
      return;
    }

    const sessionToConfirm = modalSession;
    setError(null);
    setDecisionPending(countTowardsLifetime ? "count" : "skip");
    setDismissedSessionIds((current) => updateDismissedSessionId(current, sessionToConfirm.id, true));
    startTransition(async () => {
      const result = await action(sessionToConfirm.id, countTowardsLifetime, durationSeconds);

      if (!result.success) {
        setError(result.error);
        setDecisionPending(null);
        setDismissedSessionIds((current) => updateDismissedSessionId(current, sessionToConfirm.id, false));
        return;
      }

      setDecisionPending(null);
      router.refresh();
    });
  }

  return (
    <LifetimeDecisionModal
      decisionPending={decisionPending}
      error={error}
      session={modalSession}
      onDecision={handleDecision}
    />
  );
}
