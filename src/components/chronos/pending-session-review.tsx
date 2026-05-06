"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import type { confirmChronosTimerSessionSmooth } from "@/app/admin/actions";
import type { SessionTrackingPayload } from "@/app/admin/actions";
import type { AdminPendingSession } from "@/lib/chronos/admin-dashboard";
import { LifetimeDecisionModal } from "./smooth-timer-control";

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

  function handleDecision(countTowardsLifetime: boolean, tracking: SessionTrackingPayload) {
    if (!modalSession || isPending) {
      return;
    }

    setError(null);
    setDecisionPending(countTowardsLifetime ? "count" : "skip");
    startTransition(async () => {
      const result = await action(modalSession.id, countTowardsLifetime, tracking);

      if (!result.success) {
        setError(result.error);
        setDecisionPending(null);
        return;
      }

      setDismissedSessionIds((current) => {
        const next = new Set(current);
        next.add(modalSession.id);
        return next;
      });
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
