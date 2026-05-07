"use client";

import { Children, type ReactNode, useEffect, useMemo, useRef, useState, useTransition, type DragEvent } from "react";

import { AddSkillCard } from "./add-skill-card";
import type { DashboardControls } from "./chronos-dashboard-page";

type AdminDashboardControls = Extract<DashboardControls, { mode: "admin" }>;

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
  const originalOrderRef = useRef(skillIds);
  const pendingOrderRef = useRef(skillIds);
  const rollbackOrderRef = useRef(skillIds);
  const draggingIdRef = useRef<string | null>(null);
  const savingOrderRef = useRef<string[] | null>(null);
  const didDropRef = useRef(false);
  const cardNodes = Children.toArray(children);

  const cardsById = useMemo(() => {
    return new Map(skillIds.map((skillId, index) => [skillId, cardNodes[index]]));
  }, [cardNodes, skillIds]);

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

  function handleDragStart(event: DragEvent<HTMLElement>, skillId: string) {
    if (isInteractiveDragTarget(event.target)) {
      event.preventDefault();
      return;
    }

    didDropRef.current = false;
    setError(null);
    setDraggingId(skillId);
    draggingIdRef.current = skillId;
    setDropTargetId(skillId);
    pendingOrderRef.current = orderedSkillIds;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", skillId);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, targetId: string) {
    const activeId = draggingIdRef.current ?? draggingId ?? event.dataTransfer.getData("text/plain");

    if (!activeId || activeId === targetId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetId(targetId);
    setOrderedSkillIds((currentSkillIds) => {
      const nextSkillIds = moveSkill(currentSkillIds, activeId, targetId);
      pendingOrderRef.current = nextSkillIds;
      return nextSkillIds;
    });
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    didDropRef.current = true;
    commitOrder(pendingOrderRef.current);
    draggingIdRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  }

  function handleDragEnd() {
    if (!didDropRef.current) {
      setOrderedSkillIds(originalOrderRef.current);
      pendingOrderRef.current = originalOrderRef.current;
    }

    didDropRef.current = false;
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
            data-skill-id={skillId}
            draggable={!isSaving}
            key={skillId}
            onDragEnd={handleDragEnd}
            onDragOver={(event) => handleDragOver(event, skillId)}
            onDragStart={(event) => handleDragStart(event, skillId)}
            onDrop={handleDrop}
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
