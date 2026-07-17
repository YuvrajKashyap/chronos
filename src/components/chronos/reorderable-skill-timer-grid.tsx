"use client";

import {
  Children,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { AddSkillCard } from "./add-skill-card";
import type { DashboardControls } from "./chronos-dashboard-page";

type AdminDashboardControls = Extract<DashboardControls, { mode: "admin" }>;
type DragSession = {
  activeId: string;
  armed: boolean;
  holdTimerId?: number;
  input: "mouse" | "touch";
  pointerId?: number;
  startedAtMs: number;
  startX: number;
  startY: number;
  started: boolean;
  touchId?: number;
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

function blocksTouchDragTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest("input, textarea, select, [role='menu'], [data-no-drag]"))
    : false;
}

function clearHoldTimer(session: DragSession) {
  if (session.holdTimerId !== undefined) {
    window.clearTimeout(session.holdTimerId);
    session.holdTimerId = undefined;
  }
}

function getTouchById(touches: TouchList, touchId: number | undefined) {
  if (touchId === undefined) {
    return null;
  }

  for (let index = 0; index < touches.length; index += 1) {
    const touch = touches[index];
    if (touch?.identifier === touchId) {
      return touch;
    }
  }

  return null;
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
  const dragSessionRef = useRef<DragSession | null>(null);
  const suppressNextClickRef = useRef(false);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- handlers intentionally read mutable drag refs

  useEffect(() => {
    function handleWindowTouchMove(event: TouchEvent) {
      const session = dragSessionRef.current;
      if (!session || session.input !== "touch") {
        return;
      }

      const touch = getTouchById(event.touches, session.touchId);
      if (!touch) {
        return;
      }

      if (updateTouchDrag(session.touchId, touch.clientX, touch.clientY)) {
        event.preventDefault();
      }
    }

    function handleWindowTouchEnd(event: TouchEvent) {
      const session = dragSessionRef.current;
      if (!session || session.input !== "touch" || !getTouchById(event.changedTouches, session.touchId)) {
        return;
      }

      if (session.started) {
        event.preventDefault();
      }

      finishTouchDrag(session.touchId, true);
    }

    function handleWindowTouchCancel(event: TouchEvent) {
      const session = dragSessionRef.current;
      if (!session || session.input !== "touch" || !getTouchById(event.changedTouches, session.touchId)) {
        return;
      }

      finishTouchDrag(session.touchId, false);
    }

    window.addEventListener("touchmove", handleWindowTouchMove, { capture: true, passive: false });
    window.addEventListener("touchend", handleWindowTouchEnd, { capture: true, passive: false });
    window.addEventListener("touchcancel", handleWindowTouchCancel, { capture: true, passive: false });

    return () => {
      window.removeEventListener("touchmove", handleWindowTouchMove, { capture: true });
      window.removeEventListener("touchend", handleWindowTouchEnd, { capture: true });
      window.removeEventListener("touchcancel", handleWindowTouchCancel, { capture: true });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- handlers intentionally read mutable drag refs

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
    if (isSaving || event.button !== 0 || event.pointerType !== "mouse") {
      return;
    }

    if (isInteractiveDragTarget(event.target)) {
      return;
    }

    setError(null);
    const session: DragSession = {
      activeId: skillId,
      armed: true,
      input: "mouse",
      pointerId: event.pointerId,
      startedAtMs: Date.now(),
      startX: event.clientX,
      startY: event.clientY,
      started: false,
    };
    dragSessionRef.current = session;
    pendingOrderRef.current = orderedSkillIds;

    event.preventDefault();
  }

  function startTouchDrag(event: ReactTouchEvent<HTMLElement>, skillId: string) {
    if (isSaving || event.touches.length !== 1 || blocksTouchDragTarget(event.target)) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    setError(null);
    const session: DragSession = {
      activeId: skillId,
      armed: false,
      input: "touch",
      startedAtMs: Date.now(),
      startX: touch.clientX,
      startY: touch.clientY,
      started: false,
      touchId: touch.identifier,
    };
    dragSessionRef.current = session;
    pendingOrderRef.current = orderedSkillIds;

    session.holdTimerId = window.setTimeout(() => {
      const currentSession = dragSessionRef.current;
      if (currentSession?.input === "touch" && currentSession.touchId === touch.identifier) {
        beginDrag(currentSession);
      }
    }, TOUCH_HOLD_DELAY_MS);
  }

  function beginDrag(session: DragSession) {
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
    if (!session || session.input !== "mouse" || session.pointerId !== pointerId) {
      return false;
    }

    return updateDragPosition(session, clientX, clientY);
  }

  function updateTouchDrag(touchId: number | undefined, clientX: number, clientY: number) {
    const session = dragSessionRef.current;
    if (!session || session.input !== "touch" || session.touchId !== touchId) {
      return false;
    }

    return updateDragPosition(session, clientX, clientY);
  }

  function updateDragPosition(session: DragSession, clientX: number, clientY: number) {
    const distance = Math.hypot(clientX - session.startX, clientY - session.startY);
    if (!session.armed) {
      if (session.input === "touch" && Date.now() - session.startedAtMs >= TOUCH_HOLD_DELAY_MS) {
        beginDrag(session);
      } else {
        if (distance > TOUCH_SCROLL_TOLERANCE_PX) {
          finishDrag(session, false);
        }

        return false;
      }
    }

    if (!session.started && distance < DRAG_THRESHOLD_PX) {
      return true;
    }

    if (!session.started) {
      beginDrag(session);
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
    if (!session || session.input !== "mouse" || session.pointerId !== pointerId) {
      return;
    }

    finishDrag(session, shouldCommit);
  }

  function finishTouchDrag(touchId: number | undefined, shouldCommit: boolean) {
    const session = dragSessionRef.current;
    if (!session || session.input !== "touch" || session.touchId !== touchId) {
      return;
    }

    finishDrag(session, shouldCommit);
  }

  function finishDrag(session: DragSession, shouldCommit: boolean) {
    clearHoldTimer(session);

    if (session.input === "touch" && session.started) {
      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 700);
    }

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

  function handleClickCapture(event: ReactMouseEvent<HTMLElement>) {
    if (!suppressNextClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressNextClickRef.current = false;
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
            onClickCapture={handleClickCapture}
            onPointerDown={(event) => startPointerDrag(event, skillId)}
            onTouchStartCapture={(event) => startTouchDrag(event, skillId)}
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
