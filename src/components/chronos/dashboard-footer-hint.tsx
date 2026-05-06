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
      {isViewOnly ? (
        <div className="footer-view-only-copy">
          <p>Public view of Yuvraj's current stats. Editing is available only when Yuvraj signs in.</p>
          <p>P.S. The majority of these stats have only been tracked since Yuvraj turned 21.</p>
        </div>
      ) : (
        <p>Only one timer can run at a time.</p>
      )}
    </footer>
  );
}
