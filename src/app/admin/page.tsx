import Link from "next/link";
import { redirect } from "next/navigation";

import { ChronosDashboardPage } from "@/components/chronos/chronos-dashboard-page";
import { ChronosShell } from "@/components/chronos/chronos-shell";
import { getAdminTimerState } from "@/lib/chronos/admin-dashboard";
import { getAdminActiveSessionCount, transformAdminDashboardToSkills } from "@/lib/chronos/transform-admin-dashboard";
import { createChronosServerClient } from "@/lib/supabase/server";
import {
  confirmChronosTimerSession,
  confirmChronosTimerSessionSmooth,
  createChronosSkill,
  deleteChronosSkill,
  logoutFromChronos,
  startChronosTimer,
  startChronosTimerSmooth,
  stopChronosTimer,
  stopChronosTimerSmooth,
  updateChronosSkill,
} from "./actions";

export const dynamic = "force-dynamic";

type BootstrapPayload = {
  email?: string;
  display_name?: string | null;
  access_status?: string;
  is_owner?: boolean;
};

function LogoutButton() {
  return (
    <form action={logoutFromChronos}>
      <button className="auth-outline-button" type="submit">
        Logout
      </button>
    </form>
  );
}

function AdminStatusPanel({
  email,
  bootstrap,
  error,
}: {
  email: string;
  bootstrap?: BootstrapPayload | null;
  error?: string | null;
}) {
  const isDenied = Boolean(error);

  return (
    <ChronosShell isAuthenticated>
      <main className="auth-main">
        <section className={isDenied ? "auth-panel admin-panel is-denied" : "auth-panel admin-panel"} aria-labelledby="admin-title">
          <p className="auth-kicker">{isDenied ? "Access denied" : "Owner control shell"}</p>
          <h1 id="admin-title">{isDenied ? "Chronos Admin Blocked" : "Chronos Admin"}</h1>
          <p className="auth-copy">
            {isDenied
              ? "Supabase Auth succeeded, but Chronos bootstrap rejected this account."
              : "The private time-investment ledger is authenticated and ready for timer controls."}
          </p>

          <div className="admin-status-grid">
            <div>
              <span>Signed in as</span>
              <strong>{email}</strong>
            </div>
            <div>
              <span>Bootstrap</span>
              <strong>{isDenied ? "Rejected" : "Allowed"}</strong>
            </div>
            <div>
              <span>Access status</span>
              <strong>{bootstrap?.access_status ?? (isDenied ? "Unavailable" : "Active")}</strong>
            </div>
            <div>
              <span>Timer controls</span>
              <strong>Next step</strong>
            </div>
          </div>

          {error ? <p className="auth-message is-error">{error}</p> : null}
          {!error ? <p className="auth-message">Timer start/stop, session editing, skills, settings, and insights come next.</p> : null}

          <div className="auth-actions">
            <Link className="auth-primary-link" href="/">
              Public dashboard
            </Link>
            <LogoutButton />
          </div>
        </section>
      </main>
    </ChronosShell>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const actionError = params.error ? decodeURIComponent(params.error) : null;
  let supabase;

  try {
    supabase = await createChronosServerClient();
  } catch (error) {
    return (
      <AdminStatusPanel
        email="Not available"
        error={error instanceof Error ? error.message : "Supabase is not configured."}
      />
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase.rpc("bootstrap_current_user");

  if (error) {
    return (
      <AdminStatusPanel
        email={user.email ?? "Unknown email"}
        bootstrap={(data as BootstrapPayload | null) ?? null}
        error={error.message}
      />
    );
  }

  const { data: defaultSkillsData, error: defaultSkillsError } = await supabase.rpc("ensure_default_skills");

  if (defaultSkillsError) {
    return (
      <AdminStatusPanel
        email={user.email ?? "Unknown email"}
        bootstrap={(data as BootstrapPayload | null) ?? null}
        error={defaultSkillsError.message}
      />
    );
  }

  if (
    defaultSkillsData &&
    typeof defaultSkillsData === "object" &&
    "success" in defaultSkillsData &&
    defaultSkillsData.success === false
  ) {
    return (
      <AdminStatusPanel
        email={user.email ?? "Unknown email"}
        bootstrap={(data as BootstrapPayload | null) ?? null}
        error={
          "error" in defaultSkillsData && typeof defaultSkillsData.error === "string"
            ? defaultSkillsData.error
            : "Default skills could not be ensured."
        }
      />
    );
  }

  const { state, error: timerStateError } = await getAdminTimerState();

  if (!state || timerStateError) {
    return (
      <AdminStatusPanel
        email={user.email ?? "Unknown email"}
        bootstrap={(data as BootstrapPayload | null) ?? null}
        error={timerStateError ?? "Chronos timer state is unavailable."}
      />
    );
  }

  return (
    <ChronosDashboardPage
      activeSessionCount={getAdminActiveSessionCount(state)}
      controls={{
        mode: "admin",
        nextPath: "/admin",
        confirmSessionAction: confirmChronosTimerSession,
        confirmSessionSmoothAction: confirmChronosTimerSessionSmooth,
        createSkillAction: createChronosSkill,
        deleteSkillAction: deleteChronosSkill,
        startAction: startChronosTimer,
        startSmoothAction: startChronosTimerSmooth,
        stopAction: stopChronosTimer,
        stopSmoothAction: stopChronosTimerSmooth,
        updateSkillAction: updateChronosSkill,
      }}
      isAuthenticated
      message={actionError}
      pendingSessions={state.pending_sessions ?? []}
      skills={transformAdminDashboardToSkills(state)}
    />
  );
}
