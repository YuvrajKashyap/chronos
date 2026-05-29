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
          <span className="add-skill-inner" aria-hidden="true" />
          <svg className="add-skill-contours" viewBox="0 0 330 190" aria-hidden="true">
            <path d="M-20 116 C42 86 72 90 112 123 C150 154 190 146 235 112 C275 82 307 76 350 92" />
            <path d="M-20 130 C43 101 78 104 119 135 C157 164 194 158 241 126 C280 99 313 92 350 106" />
            <path d="M-20 144 C45 118 83 119 125 148 C163 174 200 171 247 140 C286 115 319 106 350 120" />
            <path d="M-20 158 C48 134 91 134 133 160 C171 184 208 184 255 154 C292 132 324 121 350 136" />
            <path d="M-20 172 C52 151 99 149 142 173 C181 194 218 197 264 169 C300 150 329 138 350 153" />
          </svg>
          <span className="add-skill-dotfield" aria-hidden="true" />
          <svg className="add-skill-dial" viewBox="0 0 220 220" aria-hidden="true">
            <path className="dial-arc dial-arc-one" d="M42 212 A86 86 0 0 1 192 102" />
            <path className="dial-arc dial-arc-two" d="M26 215 A104 104 0 0 1 206 82" />
            <path className="dial-arc dial-arc-three" d="M10 218 A122 122 0 0 1 218 65" />
            <g className="dial-ticks">
              {Array.from({ length: 12 }).map((_, index) => (
                <path key={index} d="M110 24 L110 34" transform={`rotate(${index * 12 - 54} 110 110)`} />
              ))}
            </g>
            <path className="dial-needle" d="M110 110 L80 202" />
            <circle className="dial-pin" cx="110" cy="110" r="7" />
          </svg>
          <span className="add-skill-center">
            <span className="add-skill-orb" aria-hidden="true">
              <Plus size={40} strokeWidth={1.85} />
            </span>
            <span className="add-skill-copy">Add a skill to track.</span>
            <span className="add-skill-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
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
