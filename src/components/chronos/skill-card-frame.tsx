"use client";

import { Edit3, MoreVertical, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { SkillFormFields } from "./skill-form-fields";
import { SkillFormSubmitButton } from "./skill-form-submit-button";
import { SkillModal } from "./skill-modal";

type SkillAction = (formData: FormData) => void | Promise<void>;

export type SkillCardManageProps = {
  accentKey?: string;
  deleteAction: SkillAction;
  iconKey?: string;
  id: string;
  isActive: boolean;
  lifetimeSeconds?: number | null;
  name: string;
  nextPath: string;
  updateAction: SkillAction;
  visibility?: "public" | "private";
};

export function SkillCardFrame({
  children,
  className,
  manage,
}: {
  children: ReactNode;
  className: string;
  manage?: SkillCardManageProps;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<"edit" | "delete" | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function openMenu() {
    if (!manage) {
      return;
    }

    setMenuOpen(true);
  }

  return (
    <article
      className={className}
      onContextMenu={(event) => {
        if (!manage) {
          return;
        }

        event.preventDefault();
        openMenu();
      }}
    >
      {manage ? (
        <div className="skill-card-menu-shell" ref={menuRef}>
          <button
            className="skill-card-menu-trigger"
            type="button"
            aria-label={`Open ${manage.name} menu`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreVertical size={18} aria-hidden="true" />
          </button>
          {menuOpen ? (
            <div className="skill-card-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setModal("edit");
                }}
              >
                <Edit3 size={16} aria-hidden="true" />
                Edit
              </button>
              <button
                className="is-danger"
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setModal("delete");
                }}
              >
                <Trash2 size={16} aria-hidden="true" />
                Delete
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {children}

      {manage && modal === "edit" ? (
        <SkillModal eyebrow="Edit dashboard card" title={`Edit ${manage.name}`} onClose={() => setModal(null)}>
          <form action={manage.updateAction} className="skill-modal-form">
            <input type="hidden" name="skillId" value={manage.id} />
            <input type="hidden" name="nextPath" value={manage.nextPath} />
            <SkillFormFields
              initialValues={{
                accentKey: manage.accentKey,
                iconKey: manage.iconKey,
                lifetimeSeconds: manage.lifetimeSeconds,
                name: manage.name,
                visibility: manage.visibility,
              }}
              showLifetime
            />
            <div className="skill-modal-actions">
              <button className="skill-modal-secondary" type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <SkillFormSubmitButton label="Save changes" />
            </div>
          </form>
        </SkillModal>
      ) : null}

      {manage && modal === "delete" ? (
        <SkillModal eyebrow="Delete dashboard card" title={`Delete ${manage.name}?`} onClose={() => setModal(null)}>
          <form action={manage.deleteAction} className="skill-delete-form">
            <input type="hidden" name="skillId" value={manage.id} />
            <input type="hidden" name="nextPath" value={manage.nextPath} />
            <p>
              Are you sure you want to delete this tracker? You cannot undo this action from the dashboard.
            </p>
            {manage.isActive ? (
              <p className="skill-delete-warning">This tracker has a running timer. Stop it before deleting.</p>
            ) : null}
            <div className="skill-modal-actions">
              <button className="skill-modal-secondary" type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="skill-modal-danger" type="submit" disabled={manage.isActive}>
                Delete tracker
              </button>
            </div>
          </form>
        </SkillModal>
      ) : null}
    </article>
  );
}
