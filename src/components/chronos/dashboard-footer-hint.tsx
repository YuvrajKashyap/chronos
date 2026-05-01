import { Sprout } from "lucide-react";

export function DashboardFooterHint() {
  return (
    <footer className="footer-hint">
      <div className="footer-ornament" aria-hidden="true">
        <span />
        <div className="footer-emblem">
          <Sprout size={24} strokeWidth={1.55} />
        </div>
        <span />
      </div>
      <p>Only one timer can run at a time.</p>
    </footer>
  );
}
