import type { ReactNode } from "react";
import { ChronosTopNav } from "./chronos-top-nav";

export function ChronosShell({ children }: { children: ReactNode }) {
  return (
    <div className="chronos-page">
      <div className="global-orbit global-orbit-one" aria-hidden="true" />
      <div className="global-orbit global-orbit-two" aria-hidden="true" />
      <div className="global-wave" aria-hidden="true">
        <svg viewBox="0 0 820 220" preserveAspectRatio="none">
          <path d="M0 118 C145 112 197 48 333 62 C443 73 474 142 595 111 C710 82 711 4 820 22" />
          <path d="M16 176 C159 151 217 80 351 93 C462 103 497 184 623 141 C722 109 732 66 820 81" />
        </svg>
      </div>
      <div className="star-field" aria-hidden="true" />
      <div className="chronos-frame">
        <ChronosTopNav />
        {children}
      </div>
    </div>
  );
}
