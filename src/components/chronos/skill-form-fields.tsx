"use client";

import { useMemo, useState } from "react";

import { ACCENT_OPTIONS, CUSTOM_EMOJI_OPTIONS, ICON_OPTIONS, getSkillEmoji } from "@/lib/chronos/skill-style-options";

export type SkillFormInitialValues = {
  accentKey?: string;
  iconKey?: string;
  lifetimeSeconds?: number | null;
  name?: string;
  visibility?: "public" | "private";
};

const CATEGORY_ORDER = ["Core", "Creative", "Work", "Learning", "Wellness", "Life", "Travel", "Tech"];

function splitSeconds(totalSeconds: number | null | undefined) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds ?? 0));

  return {
    hours: Math.floor(safeSeconds / 3600),
    minutes: Math.floor((safeSeconds % 3600) / 60),
    seconds: safeSeconds % 60,
  };
}

export function SkillFormFields({
  initialValues = {},
  showLifetime = false,
}: {
  initialValues?: SkillFormInitialValues;
  showLifetime?: boolean;
}) {
  const [accentKey, setAccentKey] = useState(initialValues.accentKey ?? "coral");
  const initialEmoji = getSkillEmoji(initialValues.iconKey) ?? CUSTOM_EMOJI_OPTIONS[0];
  const [customEmoji, setCustomEmoji] = useState(initialEmoji);
  const [iconKey, setIconKey] = useState(initialValues.iconKey?.startsWith("emoji:") ? `emoji:${initialEmoji}` : (initialValues.iconKey ?? "sparkles"));
  const [visibility, setVisibility] = useState<"public" | "private">(initialValues.visibility ?? "public");
  const lifetime = splitSeconds(initialValues.lifetimeSeconds);
  const selectedIconKey = iconKey.startsWith("emoji:") ? "custom" : iconKey;

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
                  const isSelected = option.key === selectedIconKey;

                  return (
                    <button
                      className={isSelected ? "skill-icon-choice is-selected" : "skill-icon-choice"}
                      type="button"
                      key={option.key}
                      aria-pressed={isSelected}
                      title={option.label}
                      onClick={() => setIconKey(option.key === "custom" ? `emoji:${customEmoji}` : option.key)}
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

      {selectedIconKey === "custom" ? (
        <fieldset className="skill-modal-fieldset">
          <legend>Emoji mark</legend>
          <div className="skill-emoji-grid">
            {CUSTOM_EMOJI_OPTIONS.map((emoji) => {
              const isSelected = emoji === customEmoji;

              return (
                <button
                  className={isSelected ? "skill-emoji-choice is-selected" : "skill-emoji-choice"}
                  type="button"
                  key={emoji}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setCustomEmoji(emoji);
                    setIconKey(`emoji:${emoji}`);
                  }}
                >
                  <span aria-hidden="true">{emoji}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {showLifetime ? (
        <fieldset className="skill-modal-fieldset">
          <legend>Lifetime total</legend>
          <div className="skill-lifetime-grid">
            <label>
              <span>Hours</span>
              <input name="lifetimeHours" type="number" min="0" max="99999" defaultValue={lifetime.hours} />
            </label>
            <label>
              <span>Minutes</span>
              <input name="lifetimeMinutes" type="number" min="0" max="59" defaultValue={lifetime.minutes} />
            </label>
            <label>
              <span>Seconds</span>
              <input name="lifetimeSeconds" type="number" min="0" max="59" defaultValue={lifetime.seconds} />
            </label>
          </div>
        </fieldset>
      ) : null}

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
