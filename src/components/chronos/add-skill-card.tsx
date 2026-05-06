"use client";

import { Clock3, Palette, Plus, Sparkles } from "lucide-react";
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
          <span className="add-skill-backplate" aria-hidden="true" />
          <span className="add-skill-gridlines" aria-hidden="true" />
          <span className="add-skill-header">
            <span className="add-skill-emblem" aria-hidden="true">
              <Plus size={30} strokeWidth={1.9} />
            </span>
            <span className="add-skill-title">
              <span>New</span>
              <strong>Add tracker</strong>
            </span>
          </span>
          <span className="add-skill-composer" aria-hidden="true">
            <span className="add-skill-composer-top">
              <span className="add-skill-mini-icon">
                <Sparkles size={18} strokeWidth={1.9} />
              </span>
              <span className="add-skill-swatch-row">
                <span />
                <span />
                <span />
              </span>
            </span>
            <span className="add-skill-timer-row">
              <Clock3 size={16} strokeWidth={1.9} />
              <span>00:00:00</span>
            </span>
            <span className="add-skill-input-lines">
              <span />
              <span />
            </span>
            <span className="add-skill-tool-row">
              <span>
                <Palette size={14} strokeWidth={2} />
              </span>
              <span />
              <span />
              <span />
            </span>
          </span>
          <span className="add-skill-rail" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="add-skill-action" aria-hidden="true">
            <Plus size={16} strokeWidth={2.2} />
            Create tracker
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
