"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { SkillFormFields } from "./skill-form-fields";
import { SkillFormSubmitButton } from "./skill-form-submit-button";
import { SkillModal } from "./skill-modal";

type SkillAction = (formData: FormData) => void | Promise<void>;

export function AddSkillCard({
  action,
  nextPath,
}: {
  action: SkillAction;
  nextPath: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <article className="skill-card add-skill-card">
        <button className="add-skill-card-button" type="button" onClick={() => setIsOpen(true)}>
          <span className="add-skill-glow" aria-hidden="true" />
          <span className="add-skill-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="add-skill-topline">
            <span className="add-skill-icon" aria-hidden="true">
              <Plus size={34} strokeWidth={1.8} />
            </span>
            <span className="add-skill-status" aria-hidden="true">
              New
            </span>
          </span>
          <span className="add-skill-copy">
            <span className="add-skill-kicker">Dashboard card</span>
            <strong>Add tracker</strong>
          </span>
          <span className="add-skill-rule" aria-hidden="true" />
          <span className="add-skill-preview" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="add-skill-action" aria-hidden="true">
            <Plus size={16} strokeWidth={2.2} />
            Create
          </span>
        </button>
      </article>

      {isOpen ? (
        <SkillModal eyebrow="New dashboard card" title="Add Tracker" onClose={() => setIsOpen(false)}>
          <form action={action} className="skill-modal-form">
            <input type="hidden" name="nextPath" value={nextPath} />
            <SkillFormFields />
            <div className="skill-modal-actions">
              <button className="skill-modal-secondary" type="button" onClick={() => setIsOpen(false)}>
                Cancel
              </button>
              <SkillFormSubmitButton label="Add tracker" />
            </div>
          </form>
        </SkillModal>
      ) : null}
    </>
  );
}
