import { Sprout } from "lucide-react";

export function DashboardFooterHint({ isViewOnly = false }: { isViewOnly?: boolean }) {
  return (
    <footer className={isViewOnly ? "footer-hint is-view-only" : "footer-hint"}>
      <div className="footer-ornament" aria-hidden="true">
        <span />
        <div className="footer-emblem">
          <Sprout size={24} strokeWidth={1.55} />
        </div>
        <span />
      </div>
      <p>
        {isViewOnly
          ? "Public view of Yuvraj's current stats. Editing is available only when Yuvraj signs in."
          : "Only one timer can run at a time."}
      </p>
    </footer>
  );
}
