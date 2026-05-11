"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const themeStorageKey = "chronos-theme";
const themeCookieName = "chronos-theme";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

function getCookieTheme(): Theme | null {
  const cookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${themeCookieName}=`))
    ?.split("=")[1];

  return cookie && isTheme(cookie) ? cookie : null;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  let saved: string | null = null;
  try {
    saved = window.localStorage.getItem(themeStorageKey);
  } catch {
    saved = null;
  }

  if (isTheme(saved)) {
    return saved;
  }

  const cookieTheme = getCookieTheme();
  if (cookieTheme) {
    return cookieTheme;
  }

  const requested = new URLSearchParams(window.location.search).get("theme");
  if (isTheme(requested)) {
    return requested;
  }

  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Cookies still keep the server-rendered and refreshed theme aligned.
  }

  document.cookie = `${themeCookieName}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const isDark = theme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
    persistTheme(initialTheme);
  }, []);

  function toggleTheme() {
    setTheme((currentTheme) => {
      const next = currentTheme === "dark" ? "light" : "dark";
      applyTheme(next);
      persistTheme(next);
      return next;
    });
  }

  return (
    <button
      className={`theme-toggle ${isDark ? "is-dark" : "is-light"}`}
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb" />
        <span className="theme-toggle-icon theme-toggle-icon-moon">
          <Moon size={17} strokeWidth={2.15} />
        </span>
        <span className="theme-toggle-icon theme-toggle-icon-sun">
          <Sun size={17} strokeWidth={2.15} />
        </span>
      </span>
    </button>
  );
}
