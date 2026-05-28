"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const requested = new URLSearchParams(window.location.search).get("theme");
  if (requested === "light" || requested === "dark") {
    return requested;
  }

  const saved = window.localStorage.getItem("chronos-theme");
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const isDark = theme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  function toggleTheme() {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("chronos-theme", nextTheme);
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
