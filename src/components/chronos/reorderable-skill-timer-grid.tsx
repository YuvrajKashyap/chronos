"use client";

import { Children, type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { AddSkillCard } from "./add-skill-card";
import type { DashboardControls } from "./chronos-dashboard-page";

type AdminDashboardControls = Extract<DashboardControls, { mode: "admin" }>;
type PointerDragSession = {
  activeId: string;
  armed: boolean;
  holdTimerId?: number;
  pointerId: number;
  startX: number;
  startY: number;
  started: boolean;
};

const DRAG_THRESHOLD_PX = 8;
const TOUCH_HOLD_DELAY_MS = 3000;
const TOUCH_SCROLL_TOLERANCE_PX = 22;

function isSameOrder(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function moveSkill(skillIds: string[], draggingId: string, targetId: string) {
  const fromIndex = skillIds.indexOf(draggingId);
  const toIndex = skillIds.indexOf(targetId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return skillIds;
  }

  const nextSkillIds = [...skillIds];
  const [draggedSkillId] = nextSkillIds.splice(fromIndex, 1);
  nextSkillIds.splice(toIndex, 0, draggedSkillId);

  return nextSkillIds;
}

function hasSameSkillSet(left: string[], right: string[]) {
  return left.length === right.length && left.every((id) => right.includes(id));
}

function isInteractiveDragTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest("button, a, input, textarea, select, [role='menu'], [data-no-drag]"))
    : false;
}

function needsHoldToDrag(pointerType: string) {
  return pointerType !== "mouse";
}

function clearHoldTimer(session: PointerDragSession) {
  if (session.holdTimerId !== undefined) {
    window.clearTimeout(session.holdTimerId);
    session.holdTimerId = undefined;
  }
}

function getNearestSkillId(container: HTMLElement | null, clientX: number, clientY: number, activeId: string) {
  const directTarget = document.elementFromPoint(clientX, clientY);
  const directShell = directTarget instanceof HTMLElement ? directTarget.closest<HTMLElement>("[data-reorder-skill-id]") : null;
  const directId = directShell?.dataset.reorderSkillId;

  if (directId && directId !== activeId) {
    return directId;
  }

  const shells = Array.from(container?.querySelectorAll<HTMLElement>("[data-reorder-skill-id]") ?? []);
  let nearestId: string | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const shell of shells) {
    const skillId = shell.dataset.reorderSkillId;
    if (!skillId) {
      continue;
    }

    const rect = shell.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(clientX - centerX, clientY - centerY);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestId = skillId;
    }
  }

  return nearestId === activeId ? null : nearestId;
}

function scrollNearViewportEdge(clientY: number) {
  const edgeSize = 72;
  const scrollStep = 18;

  if (clientY < edgeSize) {
    window.scrollBy({ top: -scrollStep, behavior: "instant" });
  } else if (clientY > window.innerHeight - edgeSize) {
    window.scrollBy({ top: scrollStep, behavior: "instant" });
  }
}

export function ReorderableSkillTimerGrid({
  children,
  controls,
  fixedChildren,
  skillIds,
}: {
  children: ReactNode;
  controls: Pick<AdminDashboardControls, "createSkillAction" | "nextPath" | "reorderSkillAction">;
  fixedChildren?: ReactNode;
  skillIds: string[];
}) {
  const [orderedSkillIds, setOrderedSkillIds] = useState(skillIds);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();
  const gridRef = useRef<HTMLElement | null>(null);
  const originalOrderRef = useRef(skillIds);
  const pendingOrderRef = useRef(skillIds);
  const rollbackOrderRef = useRef(skillIds);
  const draggingIdRef = useRef<string | null>(null);
  const savingOrderRef = useRef<string[] | null>(null);
  const dragSessionRef = useRef<PointerDragSession | null>(null);
  const cardNodes = Children.toArray(children);

  const cardsById = useMemo(() => {
    return new Map(skillIds.map((skillId, index) => [skillId, cardNodes[index]]));
  }, [cardNodes, skillIds]);

  useEffect(() => {
    function handleWindowPointerMove(event: PointerEvent) {
      if (updatePointerDrag(event.pointerId, event.clientX, event.clientY)) {
        event.preventDefault();
      }
    }

    function handleWindowPointerUp(event: PointerEvent) {
      finishPointerDrag(event.pointerId, true);
    }

    function handleWindowPointerCancel(event: PointerEvent) {
      finishPointerDrag(event.pointerId, false);
    }

    window.addEventListener("pointermove", handleWindowPointerMove, { capture: true, passive: false });
    window.addEventListener("pointerup", handleWindowPointerUp, { capture: true });
    window.addEventListener("pointercancel", handleWindowPointerCancel, { capture: true });

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove, { capture: true });
      window.removeEventListener("pointerup", handleWindowPointerUp, { capture: true });
      window.removeEventListener("pointercancel", handleWindowPointerCancel, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (draggingId) {
      return;
    }

    const savingOrder = savingOrderRef.current;
    if (savingOrder) {
      if (isSameOrder(skillIds, savingOrder)) {
        savingOrderRef.current = null;
        originalOrderRef.current = skillIds;
        pendingOrderRef.current = skillIds;
      }

      if (!hasSameSkillSet(skillIds, savingOrder)) {
        savingOrderRef.current = null;
        originalOrderRef.current = skillIds;
        pendingOrderRef.current = skillIds;
        rollbackOrderRef.current = skillIds;
        setOrderedSkillIds(skillIds);
      }

      return;
    }

    if (!hasSameSkillSet(skillIds, originalOrderRef.current)) {
      originalOrderRef.current = skillIds;
      pendingOrderRef.current = skillIds;
      rollbackOrderRef.current = skillIds;
      setOrderedSkillIds(skillIds);
      return;
    }

    if (isSameOrder(orderedSkillIds, originalOrderRef.current)) {
      setOrderedSkillIds(skillIds);
    }

    originalOrderRef.current = skillIds;
    pendingOrderRef.current = skillIds;
  }, [draggingId, orderedSkillIds, skillIds]);

  function commitOrder(nextSkillIds: string[]) {
    if (isSameOrder(nextSkillIds, originalOrderRef.current)) {
      return;
    }

    setError(null);
    rollbackOrderRef.current = originalOrderRef.current;
    savingOrderRef.current = nextSkillIds;
    setOrderedSkillIds(nextSkillIds);
    startTransition(async () => {
      const result = await controls.reorderSkillAction(nextSkillIds);

      if (!result.success) {
        savingOrderRef.current = null;
        setError(result.error);
        originalOrderRef.current = rollbackOrderRef.current;
        setOrderedSkillIds(rollbackOrderRef.current);
        pendingOrderRef.current = rollbackOrderRef.current;
        return;
      }

      originalOrderRef.current = nextSkillIds;
      pendingOrderRef.current = nextSkillIds;
    });
  }

  function startPointerDrag(event: ReactPointerEvent<HTMLElement>, skillId: string) {
    if (isSaving || event.button !== 0) {
      return;
    }

    if (isInteractiveDragTarget(event.target)) {
      return;
    }

    const requiresHold = needsHoldToDrag(event.pointerType);

    setError(null);
    const session: PointerDragSession = {
      activeId: skillId,
      armed: !requiresHold,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      started: false,
    };
    dragSessionRef.current = session;
    pendingOrderRef.current = orderedSkillIds;

    if (requiresHold) {
      session.holdTimerId = window.setTimeout(() => {
        const currentSession = dragSessionRef.current;
        if (currentSession?.pointerId === event.pointerId) {
          beginPointerDrag(currentSession);
        }
      }, TOUCH_HOLD_DELAY_MS);
      return;
    }

    event.preventDefault();
  }

  function beginPointerDrag(session: PointerDragSession) {
    clearHoldTimer(session);
    session.armed = true;

    if (session.started) {
      return;
    }

    session.started = true;
    draggingIdRef.current = session.activeId;
    setDraggingId(session.activeId);
    setDropTargetId(session.activeId);
  }

  function updatePointerDrag(pointerId: number, clientX: number, clientY: number) {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== pointerId) {
      return false;
    }

    const distance = Math.hypot(clientX - session.startX, clientY - session.startY);
    if (!session.armed) {
      if (distance > TOUCH_SCROLL_TOLERANCE_PX) {
        finishPointerDrag(pointerId, false);
      }

      return false;
    }

    if (!session.started && distance < DRAG_THRESHOLD_PX) {
      return true;
    }

    if (!session.started) {
      beginPointerDrag(session);
    }

    scrollNearViewportEdge(clientY);

    const targetId = getNearestSkillId(gridRef.current, clientX, clientY, session.activeId);
    if (!targetId) {
      return true;
    }

    setDropTargetId(targetId);
    setOrderedSkillIds((currentSkillIds) => {
      const nextSkillIds = moveSkill(currentSkillIds, session.activeId, targetId);
      pendingOrderRef.current = nextSkillIds;
      return nextSkillIds;
    });

    return true;
  }

  function finishPointerDrag(pointerId: number, shouldCommit: boolean) {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== pointerId) {
      return;
    }

    clearHoldTimer(session);

    if (session.started && shouldCommit) {
      commitOrder(pendingOrderRef.current);
    } else if (session.started) {
      setOrderedSkillIds(originalOrderRef.current);
      pendingOrderRef.current = originalOrderRef.current;
    }

    dragSessionRef.current = null;
    draggingIdRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  }

  return (
    <>
      {error ? <p className="admin-inline-message is-error reorder-message">{error}</p> : null}
      <section
        className={draggingId || isSaving ? "skill-grid is-reordering" : "skill-grid"}
        aria-busy={isSaving}
        aria-label="Skill timers"
        ref={gridRef}
      >
        {orderedSkillIds.map((skillId) => (
          <div
            className={[
              "reorder-card-shell",
              !isSaving ? "is-reorderable" : "",
              draggingId === skillId ? "is-dragging" : "",
              dropTargetId === skillId && draggingId !== skillId ? "is-drop-target" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-reorder-skill-id={skillId}
            key={skillId}
            onPointerDown={(event) => startPointerDrag(event, skillId)}
          >
            {cardsById.get(skillId)}
          </div>
        ))}
        {fixedChildren}
        <AddSkillCard action={controls.createSkillAction} nextPath={controls.nextPath} />
      </section>
    </>
  );
}
