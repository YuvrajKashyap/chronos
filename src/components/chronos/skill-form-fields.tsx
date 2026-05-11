"use client";

import type { SkillMotif } from "@/lib/chronos-sample-data";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

import {
  ACCENT_OPTIONS,
  CUSTOM_EMOJI_OPTIONS,
  ICON_OPTIONS,
  SKILL_MOTIF_OPTIONS,
  buildSkillIconKey,
  getSkillAccentKeyFromHex,
  getSkillAccentOption,
  getSkillCustomAccent,
  getSkillEmoji,
  getSkillMotif,
  splitSkillIconKey,
} from "@/lib/chronos/skill-style-options";
import { CardMotif } from "./card-motif";
import styles from "./custom-color-picker.module.css";

export type SkillFormInitialValues = {
  accentKey?: string;
  iconKey?: string;
  lifetimeSeconds?: number | null;
  name?: string;
  weeklyTargetSeconds?: number | null;
  targetSessionsPerWeek?: number | null;
  priorityWeight?: number | null;
  goalNote?: string | null;
  visibility?: "public" | "private";
};

const CATEGORY_ORDER = ["Core", "Creative", "Work", "Learning", "Wellness", "Life", "Travel", "Tech"];
const DEFAULT_CUSTOM_ACCENT = "#ff563f";
const CUSTOM_ACCENT_PRESETS = [
  { color: "#ff563f", label: "Ember" },
  { color: "#f0ad2c", label: "Gilded" },
  { color: "#32c4ab", label: "Aqua" },
  { color: "#3f8dff", label: "Signal" },
  { color: "#9a66ef", label: "Violet" },
  { color: "#f06aa6", label: "Bloom" },
];

function splitSeconds(totalSeconds: number | null | undefined) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds ?? 0));

  return {
    hours: Math.floor(safeSeconds / 3600),
    minutes: Math.floor((safeSeconds % 3600) / 60),
    seconds: safeSeconds % 60,
  };
}

function normalizeHexInput(value: string) {
  const cleaned = value.trim().replace(/^#/, "").replace(/[^0-9a-f]/gi, "").slice(0, 6);

  return `#${cleaned}`;
}

function isCompleteHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value.trim());
}

function getRandomMotif() {
  return SKILL_MOTIF_OPTIONS[Math.floor(Math.random() * SKILL_MOTIF_OPTIONS.length)]?.key ?? "contour";
}

function getInitialMotif(initialValues: SkillFormInitialValues) {
  const storedMotif = getSkillMotif(initialValues.iconKey);

  if (storedMotif) {
    return storedMotif;
  }

  if (initialValues.name) {
    return getSkillAccentOption(initialValues.accentKey).motif;
  }

  return getRandomMotif();
}

export function SkillFormFields({
  initialValues = {},
  showLifetime = false,
}: {
  initialValues?: SkillFormInitialValues;
  showLifetime?: boolean;
}) {
  const initialCustomAccent = getSkillCustomAccent(initialValues.accentKey);
  const [customAccentColor, setCustomAccentColor] = useState(initialCustomAccent?.color ?? DEFAULT_CUSTOM_ACCENT);
  const [customAccentDraft, setCustomAccentDraft] = useState(initialCustomAccent?.color ?? DEFAULT_CUSTOM_ACCENT);
  const [accentKey, setAccentKey] = useState(initialCustomAccent?.key ?? initialValues.accentKey ?? "coral");
  const initialBaseIconKey = splitSkillIconKey(initialValues.iconKey).iconKey;
  const initialEmoji = getSkillEmoji(initialBaseIconKey) ?? CUSTOM_EMOJI_OPTIONS[0];
  const [customEmoji, setCustomEmoji] = useState(initialEmoji);
  const [iconKey, setIconKey] = useState(initialBaseIconKey.startsWith("emoji:") ? `emoji:${initialEmoji}` : (initialBaseIconKey || "sparkles"));
  const [iconSearch, setIconSearch] = useState("");
  const [motifKey, setMotifKey] = useState<SkillMotif>(() => getInitialMotif(initialValues));
  const [visibility, setVisibility] = useState<"public" | "private">(initialValues.visibility ?? "public");
  const lifetime = splitSeconds(initialValues.lifetimeSeconds);
  const weeklyTarget = splitSeconds(initialValues.weeklyTargetSeconds);
  const selectedIconKey = iconKey.startsWith("emoji:") ? "custom" : iconKey;
  const isCustomAccent = Boolean(getSkillCustomAccent(accentKey));
  const selectedAccentKey = isCustomAccent ? getSkillAccentKeyFromHex(customAccentColor) : accentKey;
  const storedIconKey = buildSkillIconKey(iconKey, motifKey);
  const customAccentStyle = {
    "--custom-accent": customAccentColor,
  } as CSSProperties;

  function commitCustomAccent(nextColor: string) {
    if (!isCompleteHexColor(nextColor)) {
      return;
    }

    const normalized = nextColor.toLowerCase();
    setCustomAccentColor(normalized);
    setCustomAccentDraft(normalized);
    setAccentKey(getSkillAccentKeyFromHex(normalized));
  }

  const groupedIcons = useMemo(() => {
    const query = iconSearch.trim().toLowerCase();

    return CATEGORY_ORDER.map((category) => ({
      category,
      icons: ICON_OPTIONS.filter((option) => {
        if (option.category !== category) {
          return false;
        }

        if (!query) {
          return true;
        }

        return `${option.label} ${option.key} ${option.category}`.toLowerCase().includes(query);
      }),
    })).filter((group) => group.icons.length > 0);
  }, [iconSearch]);

  return (
    <>
      <label className="skill-modal-field skill-name-field">
        <span>Name</span>
        <input name="name" defaultValue={initialValues.name ?? ""} maxLength={42} required />
      </label>

      <input type="hidden" name="iconKey" value={storedIconKey} />
      <input type="hidden" name="accentKey" value={selectedAccentKey} />
      <input type="hidden" name="visibility" value={visibility} />

      <div className="skill-form-left">
        <fieldset className="skill-modal-fieldset skill-logo-fieldset">
          <legend>Logo bank</legend>
          <label className="skill-icon-search">
            <span>Search logos</span>
            <input
              type="search"
              value={iconSearch}
              onChange={(event) => setIconSearch(event.target.value)}
            />
          </label>
          <div className="skill-icon-bank">
            {groupedIcons.length > 0 ? groupedIcons.map((group) => (
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
            )) : (
              <p className="skill-icon-empty">No logos match.</p>
            )}
          </div>
        </fieldset>

        {selectedIconKey === "custom" ? (
          <fieldset className="skill-modal-fieldset skill-emoji-fieldset">
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

        <fieldset className="skill-modal-fieldset skill-motif-fieldset">
          <legend>Card background</legend>
          <div className="skill-motif-row">
            {SKILL_MOTIF_OPTIONS.map((option) => (
              <button
                className={option.key === motifKey ? "skill-motif-choice is-selected" : "skill-motif-choice"}
                type="button"
                key={option.key}
                aria-pressed={option.key === motifKey}
                onClick={() => setMotifKey(option.key)}
              >
                <span className="skill-motif-preview" aria-hidden="true">
                  <CardMotif type={option.key} />
                </span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="skill-form-right">
        {showLifetime ? (
          <fieldset className="skill-modal-fieldset skill-lifetime-fieldset">
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

        {showLifetime ? (
          <fieldset className="skill-modal-fieldset skill-goal-fieldset">
            <legend>Goal tracking</legend>
            <div className="skill-lifetime-grid">
              <label>
                <span>Target h/wk</span>
                <input name="weeklyTargetHours" type="number" min="0" max="999" defaultValue={weeklyTarget.hours} />
              </label>
              <label>
                <span>Target m/wk</span>
                <input name="weeklyTargetMinutes" type="number" min="0" max="59" defaultValue={weeklyTarget.minutes} />
              </label>
              <label>
                <span>Sessions/wk</span>
                <input name="targetSessionsPerWeek" type="number" min="0" max="99" defaultValue={initialValues.targetSessionsPerWeek ?? 0} />
              </label>
              <label>
                <span>Priority</span>
                <input name="priorityWeight" type="number" min="1" max="5" defaultValue={initialValues.priorityWeight ?? 3} />
              </label>
            </div>
            <label className="skill-modal-field">
              <span>Goal note</span>
              <textarea name="goalNote" defaultValue={initialValues.goalNote ?? ""} placeholder="What should this tracker mean long term?" maxLength={500} />
            </label>
          </fieldset>
        ) : null}

        <fieldset className="skill-modal-fieldset skill-accent-fieldset">
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
            <button
              className={`skill-accent-choice skill-accent-custom ${isCustomAccent ? "is-selected" : ""}`}
              style={customAccentStyle}
              title="Custom accent"
              type="button"
              aria-pressed={isCustomAccent}
              onClick={() => setAccentKey(getSkillAccentKeyFromHex(customAccentColor))}
            >
              <span className="skill-accent-wheel" aria-hidden="true" />
              Custom
            </button>
          </div>
          {isCustomAccent ? (
            <div className={styles.customColorPanel} style={customAccentStyle}>
              <div className={styles.colorPreview} aria-hidden="true">
                <span className={styles.previewGlow} />
                <span className={styles.previewOrb} />
                <span className={styles.previewRing} />
              </div>
              <div className={styles.customColorBody}>
                <div className={styles.customColorHeader}>
                  <span>Custom tone</span>
                  <strong>{customAccentColor.toUpperCase()}</strong>
                </div>
                <label className={styles.hexField}>
                  <span>Hex value</span>
                  <input
                    value={customAccentDraft}
                    inputMode="text"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={7}
                    aria-label="Custom accent hex color"
                    onBlur={() => {
                      if (isCompleteHexColor(customAccentDraft)) {
                        commitCustomAccent(customAccentDraft);
                      } else {
                        setCustomAccentDraft(customAccentColor);
                      }
                    }}
                    onChange={(event) => {
                      const nextDraft = normalizeHexInput(event.target.value);
                      setCustomAccentDraft(nextDraft);

                      if (isCompleteHexColor(nextDraft)) {
                        commitCustomAccent(nextDraft);
                      }
                    }}
                  />
                </label>
                <div className={styles.presetRail} aria-label="Custom accent presets">
                  {CUSTOM_ACCENT_PRESETS.map((preset) => (
                    <button
                      className={preset.color.toLowerCase() === customAccentColor ? styles.activePreset : ""}
                      type="button"
                      key={preset.color}
                      style={{ "--preset-color": preset.color } as CSSProperties}
                      aria-label={`Use ${preset.label} custom color`}
                      onClick={() => commitCustomAccent(preset.color)}
                    >
                      <span aria-hidden="true" />
                      {preset.label}
                    </button>
                  ))}
                </div>
                <label className={styles.nativeSpectrum}>
                  <span>Open spectrum</span>
                  <input
                    type="color"
                    value={customAccentColor}
                    aria-label="Open native color spectrum"
                    onChange={(event) => commitCustomAccent(event.target.value)}
                  />
                </label>
              </div>
            </div>
          ) : null}
        </fieldset>

        <fieldset className="skill-modal-fieldset skill-visibility-fieldset">
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
      </div>
    </>
  );
}
