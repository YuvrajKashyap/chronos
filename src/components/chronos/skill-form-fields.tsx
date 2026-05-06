"use client";

import { useMemo, useState } from "react";

import { ACCENT_OPTIONS, ICON_OPTIONS } from "@/lib/chronos/skill-style-options";

export type SkillFormInitialValues = {
  accentKey?: string;
  iconKey?: string;
  name?: string;
  visibility?: "public" | "private";
};

const CATEGORY_ORDER = ["Core", "Sport", "Creative", "Work", "Learning", "Wellness", "Life", "Travel", "Tech"];

export function SkillFormFields({ initialValues = {} }: { initialValues?: SkillFormInitialValues }) {
  const [accentKey, setAccentKey] = useState(initialValues.accentKey ?? "coral");
  const [iconKey, setIconKey] = useState(initialValues.iconKey ?? "sparkles");
  const [visibility, setVisibility] = useState<"public" | "private">(initialValues.visibility ?? "public");

  const groupedIcons = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      icons: ICON_OPTIONS.filter((option) => option.category === category),
    })).filter((group) => group.icons.length > 0);
  }, []);

  return (
    <>
      <label className="skill-modal-field">
        <span>Name</span>
        <input name="name" defaultValue={initialValues.name ?? ""} placeholder="Tennis, deep work, piano..." maxLength={42} required />
      </label>

      <input type="hidden" name="iconKey" value={iconKey} />
      <input type="hidden" name="accentKey" value={accentKey} />
      <input type="hidden" name="visibility" value={visibility} />

      <fieldset className="skill-modal-fieldset">
        <legend>Logo bank</legend>
        <div className="skill-icon-bank">
          {groupedIcons.map((group) => (
            <div className="skill-icon-bank-group" key={group.category}>
              <span>{group.category}</span>
              <div className="skill-icon-bank-grid">
                {group.icons.map((option) => {
                  const Icon = option.icon;
                  const isSelected = option.key === iconKey;

                  return (
                    <button
                      className={isSelected ? "skill-icon-choice is-selected" : "skill-icon-choice"}
                      type="button"
                      key={option.key}
                      aria-pressed={isSelected}
                      title={option.label}
                      onClick={() => setIconKey(option.key)}
                    >
                      <Icon size={19} strokeWidth={2} aria-hidden="true" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="skill-modal-fieldset">
        <legend>Accent</legend>
        <div className="skill-accent-row">
          {ACCENT_OPTIONS.map((option) => (
            <button
              className={`skill-accent-choice accent-${option.key} ${option.key === accentKey ? "is-selected" : ""}`}
              type="button"
              key={option.key}
              aria-pressed={option.key === accentKey}
              onClick={() => setAccentKey(option.key)}
            >
              <span aria-hidden="true" />
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="skill-modal-fieldset">
        <legend>Visibility</legend>
        <div className="skill-visibility-row">
          <button
            className={visibility === "public" ? "skill-visibility-choice is-selected" : "skill-visibility-choice"}
            type="button"
            aria-pressed={visibility === "public"}
            onClick={() => setVisibility("public")}
          >
            Public
          </button>
          <button
            className={visibility === "private" ? "skill-visibility-choice is-selected" : "skill-visibility-choice"}
            type="button"
            aria-pressed={visibility === "private"}
            onClick={() => setVisibility("private")}
          >
            Private
          </button>
        </div>
      </fieldset>
    </>
  );
}
