"use client";

import {
  BarChart3,
  CalendarDays,
  Grid2X2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { UserPill } from "./user-pill";

const navItems = [
  { label: "Dashboard", icon: Grid2X2, href: "/" },
  { label: "Sessions", icon: CalendarDays, href: "/sessions" },
  { label: "Insights", icon: BarChart3, href: "/insights" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function ChronosTopNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();

  return (
    <header className="top-nav">
      <Link className="wordmark" aria-label="Chronos" href="/">
        CHRONOS
      </Link>
      <nav className="primary-nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" || pathname === "/admin" : pathname.startsWith(item.href);

          return (
            <Link
              className={isActive ? "nav-link active" : "nav-link"}
              href={item.href}
              key={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        <UserPill isAuthenticated={isAuthenticated} />
      </div>
    </header>
  );
}
