"use client";

import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Grid2X2,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { UserPill } from "./user-pill";

const navItems = [
  { label: "Dashboard", icon: Grid2X2, active: true },
  { label: "Sessions", icon: CalendarDays, active: false },
  { label: "Insights", icon: BarChart3, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export function ChronosTopNav() {
  return (
    <header className="top-nav">
      <div className="wordmark" aria-label="Chronos">
        CHRONOS
      </div>
      <nav className="primary-nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              className={item.active ? "nav-link active" : "nav-link"}
              href="#"
              key={item.label}
              aria-current={item.active ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        <UserPill />
        <ChevronDown className="mobile-chevron" size={18} aria-hidden="true" />
      </div>
    </header>
  );
}
