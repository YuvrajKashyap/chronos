"use client";

import type { SkillMotif } from "@/lib/chronos-sample-data";
import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Copy, Plus, X } from "lucide-react";

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
  "#ff5640",
  "#f49a22",
  "#ffd341",
  "#4ccb72",
  "#36c2cc",
  "#3477f5",
  "#7b35db",
  "#e34f8a",
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

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(value: string) {
  const fallback = DEFAULT_CUSTOM_ACCENT;
  const hex = isCompleteHexColor(value) ? value : fallback;
  const raw = hex.replace("#", "");

  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${[r, g, b].map((channel) => clampNumber(Math.round(channel), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsv({ r, g, b }: { r: number; g: number; b: number }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  return {
    h: hue < 0 ? hue + 360 : hue,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  };
}

function hsvToRgb({ h, s, v }: { h: number; s: number; v: number }) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clampNumber(s, 0, 100) / 100;
  const value = clampNumber(v, 0, 100) / 100;
  const chroma = value * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = value - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    red = chroma;
    green = x;
  } else if (hue < 120) {
    red = x;
    green = chroma;
  } else if (hue < 180) {
    green = chroma;
    blue = x;
  } else if (hue < 240) {
    green = x;
    blue = chroma;
  } else if (hue < 300) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return {
    r: Math.round((red + m) * 255),
    g: Math.round((green + m) * 255),
    b: Math.round((blue + m) * 255),
  };
}

function hsvToHex(hsv: { h: number; s: number; v: number }) {
  return rgbToHex(hsvToRgb(hsv));
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
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
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
  const customRgb = hexToRgb(customAccentColor);
  const customHsv = rgbToHsv(customRgb);
  const customAccentStyle = {
    "--custom-accent": customAccentColor,
    "--custom-hue-color": hsvToHex({ h: customHsv.h, s: 100, v: 100 }),
  } as CSSProperties;
  const svPlaneRef = useRef<HTMLDivElement>(null);
  const hueRailRef = useRef<HTMLDivElement>(null);

  function commitCustomAccent(nextColor: string) {
    if (!isCompleteHexColor(nextColor)) {
      return;
    }

    const normalized = nextColor.toLowerCase();
    setCustomAccentColor(normalized);
    setCustomAccentDraft(normalized);
    setAccentKey(getSkillAccentKeyFromHex(normalized));
  }

  function pickFromSaturationValue(clientX: number, clientY: number) {
    const box = svPlaneRef.current?.getBoundingClientRect();
    if (!box) {
      return;
    }

    const nextSaturation = clampNumber(((clientX - box.left) / box.width) * 100, 0, 100);
    const nextValue = clampNumber(100 - ((clientY - box.top) / box.height) * 100, 0, 100);
    commitCustomAccent(hsvToHex({ h: customHsv.h, s: nextSaturation, v: nextValue }));
  }

  function pickFromHue(clientX: number, clientY: number) {
    const box = hueRailRef.current?.getBoundingClientRect();
    if (!box) {
      return;
    }

    const isHorizontal = box.width > box.height;
    const offset = isHorizontal ? clientX - box.left : clientY - box.top;
    const length = isHorizontal ? box.width : box.height;
    const nextHue = clampNumber((offset / length) * 360, 0, 359);
    commitCustomAccent(hsvToHex({ h: nextHue, s: customHsv.s, v: customHsv.v }));
  }

  function handleRgbChannel(channel: "r" | "g" | "b", value: string) {
    const nextValue = clampNumber(Math.floor(Number(value) || 0), 0, 255);
    commitCustomAccent(rgbToHex({ ...customRgb, [channel]: nextValue }));
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
              onClick={() => {
                setAccentKey(getSkillAccentKeyFromHex(customAccentColor));
                setIsColorPickerOpen(true);
              }}
            >
              <span className="skill-accent-wheel" aria-hidden="true" />
              Custom
            </button>
          </div>
          {isColorPickerOpen ? (
            <div className={styles.colorPickerBackdrop} role="presentation">
              <div className={styles.colorPickerDialog} style={customAccentStyle} role="dialog" aria-modal="true" aria-label="Custom color picker">
                <button className={styles.closeButton} type="button" aria-label="Close color picker" onClick={() => setIsColorPickerOpen(false)}>
                  <X size={28} strokeWidth={1.8} aria-hidden="true" />
                </button>

                <div className={styles.colorPickerTopbar}>
                  <div className={styles.titleCluster}>
                    <span>Color</span>
                    <div className={styles.colorIdentity}>
                      <span className={styles.currentSwatch} aria-hidden="true" />
                      <label className={styles.topHexField}>
                        <input
                          value={customAccentDraft.toUpperCase()}
                          inputMode="text"
                          autoCapitalize="characters"
                          spellCheck={false}
                          maxLength={7}
                          aria-label="Current custom color hex value"
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
                        <button
                          type="button"
                          aria-label="Copy color value"
                          onClick={() => void navigator.clipboard?.writeText(customAccentColor.toUpperCase())}
                        >
                          <Copy size={23} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </label>
                    </div>
                  </div>
                </div>

                <div className={styles.pickerStage}>
                  <div
                    className={styles.saturationPlane}
                    ref={svPlaneRef}
                    role="slider"
                    tabIndex={0}
                    aria-label="Color saturation and brightness"
                    aria-valuetext={`${Math.round(customHsv.s)} percent saturation, ${Math.round(customHsv.v)} percent brightness`}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      pickFromSaturationValue(event.clientX, event.clientY);
                    }}
                    onPointerMove={(event) => {
                      if (event.buttons === 1) {
                        pickFromSaturationValue(event.clientX, event.clientY);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowRight") {
                        event.preventDefault();
                        commitCustomAccent(hsvToHex({ ...customHsv, s: customHsv.s + 2 }));
                      }
                      if (event.key === "ArrowLeft") {
                        event.preventDefault();
                        commitCustomAccent(hsvToHex({ ...customHsv, s: customHsv.s - 2 }));
                      }
                      if (event.key === "ArrowUp") {
                        event.preventDefault();
                        commitCustomAccent(hsvToHex({ ...customHsv, v: customHsv.v + 2 }));
                      }
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        commitCustomAccent(hsvToHex({ ...customHsv, v: customHsv.v - 2 }));
                      }
                    }}
                  >
                    <span
                      className={styles.saturationHandle}
                      style={{
                        left: `${customHsv.s}%`,
                        top: `${100 - customHsv.v}%`,
                      }}
                    />
                  </div>

                  <div
                    className={styles.hueRail}
                    ref={hueRailRef}
                    style={{ "--hue-x": `${(customHsv.h / 360) * 100}` } as CSSProperties}
                    role="slider"
                    tabIndex={0}
                    aria-label="Color hue"
                    aria-valuemin={0}
                    aria-valuemax={359}
                    aria-valuenow={Math.round(customHsv.h)}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      pickFromHue(event.clientX, event.clientY);
                    }}
                    onPointerMove={(event) => {
                      if (event.buttons === 1) {
                        pickFromHue(event.clientX, event.clientY);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                        event.preventDefault();
                        commitCustomAccent(hsvToHex({ ...customHsv, h: customHsv.h - 4 }));
                      }
                      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                        event.preventDefault();
                        commitCustomAccent(hsvToHex({ ...customHsv, h: customHsv.h + 4 }));
                      }
                    }}
                  >
                    <span className={styles.hueHandle} style={{ top: `${(customHsv.h / 360) * 100}%` }} />
                  </div>
                </div>

                <section className={styles.presetSection} aria-label="Color presets">
                  <span>Presets</span>
                  <div className={styles.presetDots}>
                    {CUSTOM_ACCENT_PRESETS.map((preset) => (
                      <button
                        className={preset.toLowerCase() === customAccentColor ? styles.activePreset : ""}
                        type="button"
                        key={preset}
                        style={{ "--preset-color": preset } as CSSProperties}
                        aria-label={`Use ${preset.toUpperCase()} preset`}
                        onClick={() => commitCustomAccent(preset)}
                      />
                    ))}
                    <button className={styles.addPreset} type="button" aria-label="Custom color is controlled above">
                      <Plus size={25} strokeWidth={1.6} aria-hidden="true" />
                    </button>
                  </div>
                </section>

                <div className={styles.valueGrid}>
                  <label>
                    <span>Hex</span>
                    <input
                      value={customAccentDraft.toUpperCase()}
                      inputMode="text"
                      autoCapitalize="characters"
                      spellCheck={false}
                      maxLength={7}
                      aria-label="Hex color"
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

                  <div className={styles.rgbGroup}>
                    <span>RGB</span>
                    <div>
                      <input aria-label="Red" type="number" min={0} max={255} value={customRgb.r} onChange={(event) => handleRgbChannel("r", event.target.value)} />
                      <i aria-hidden="true">,</i>
                      <input aria-label="Green" type="number" min={0} max={255} value={customRgb.g} onChange={(event) => handleRgbChannel("g", event.target.value)} />
                      <i aria-hidden="true">,</i>
                      <input aria-label="Blue" type="number" min={0} max={255} value={customRgb.b} onChange={(event) => handleRgbChannel("b", event.target.value)} />
                    </div>
                  </div>
                </div>
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
