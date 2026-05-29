import { ChronosDashboardPage } from "@/components/chronos/chronos-dashboard-page";
import { ChronosShell } from "@/components/chronos/chronos-shell";
import { chronosSkills } from "@/lib/chronos-sample-data";
import { getAdminTimerState } from "@/lib/chronos/admin-dashboard";
import { getPublicDashboard } from "@/lib/chronos/public-dashboard";
import {
  getAdminActiveSessionCount,
  getAdminIdleSession,
  transformAdminDashboardToSkills,
  transformAdminDowntimeSkill,
} from "@/lib/chronos/transform-admin-dashboard";
import {
  getPublicActiveSessionCount,
  hasUsefulPublicDashboardData,
  parseDashboardSortMode,
  transformPublicDashboardToSkills,
  type DashboardSortMode,
} from "@/lib/chronos/transform-dashboard";
import { createChronosServerClient } from "@/lib/supabase/server";
import {
  confirmChronosTimerSession,
  confirmChronosTimerSessionSmooth,
  createChronosSkill,
  deleteChronosSkill,
  reorderChronosSkills,
  startChronosTimer,
  startChronosTimerSmooth,
  stopChronosTimer,
  stopChronosTimerSmooth,
  updateChronosSkill,
} from "./admin/actions";

export const dynamic = "force-dynamic";

type AuthenticatedDashboardResult =
  | { status: "anonymous" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      activeSessionCount: number;
      downtimeSkill: ReturnType<typeof transformAdminDowntimeSkill>;
      idleSession: ReturnType<typeof getAdminIdleSession>;
      pendingSessions: NonNullable<Awaited<ReturnType<typeof getAdminTimerState>>["state"]>["pending_sessions"];
      skills: ReturnType<typeof transformAdminDashboardToSkills>;
    };

function getDefaultSkillsError(data: unknown) {
  if (
    data &&
    typeof data === "object" &&
    "success" in data &&
    data.success === false &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return "Default dashboard cards could not be ensured.";
}

function AdminDashboardLoadError({ message }: { message: string }) {
  return (
    <ChronosShell isAuthenticated>
      <main className="route-main">
        <section className="route-panel" aria-labelledby="dashboard-error-title">
          <p className="auth-kicker">Dashboard unavailable</p>
          <h1 id="dashboard-error-title">Chronos Admin Could Not Load</h1>
          <p>{message}</p>
        </section>
      </main>
    </ChronosShell>
  );
}

function getDashboardNextPath(pathname: "/" | "/admin", requestedSortMode: string | undefined, sortMode: DashboardSortMode) {
  return requestedSortMode ? `${pathname}?sort=${sortMode}` : pathname;
}

async function getAuthenticatedDashboard(sortMode: DashboardSortMode) {
  let supabase;

  try {
    supabase = await createChronosServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { status: "anonymous" } satisfies AuthenticatedDashboardResult;
    }
  } catch {
    return { status: "anonymous" } satisfies AuthenticatedDashboardResult;
  }

  try {
    const { error: bootstrapError } = await supabase.rpc("bootstrap_current_user");
    if (bootstrapError) {
      return { status: "error", message: bootstrapError.message } satisfies AuthenticatedDashboardResult;
    }

    const { data: defaultSkillsData, error: defaultSkillsError } = await supabase.rpc("ensure_default_skills");
    if (defaultSkillsError) {
      return { status: "error", message: defaultSkillsError.message } satisfies AuthenticatedDashboardResult;
    }

    if (
      defaultSkillsData &&
      typeof defaultSkillsData === "object" &&
      "success" in defaultSkillsData &&
      defaultSkillsData.success === false
    ) {
      return { status: "error", message: getDefaultSkillsError(defaultSkillsData) } satisfies AuthenticatedDashboardResult;
    }

    const { state, error: timerStateError } = await getAdminTimerState();
    if (!state || timerStateError) {
      return {
        status: "error",
        message: timerStateError ?? "Chronos timer state is unavailable.",
      } satisfies AuthenticatedDashboardResult;
    }

    return {
      status: "ready",
      activeSessionCount: getAdminActiveSessionCount(state),
      downtimeSkill: transformAdminDowntimeSkill(state),
      idleSession: getAdminIdleSession(state),
      pendingSessions: state.pending_sessions ?? [],
      skills: transformAdminDashboardToSkills(state, sortMode),
    } satisfies AuthenticatedDashboardResult;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Chronos admin dashboard could not load.",
    } satisfies AuthenticatedDashboardResult;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const actionError = params.error ? decodeURIComponent(params.error) : null;
  const sortMode = parseDashboardSortMode(params.sort);
  const nextPath = getDashboardNextPath("/", params.sort, sortMode);
  const adminDashboard = await getAuthenticatedDashboard(sortMode);

  if (adminDashboard.status === "error") {
    return <AdminDashboardLoadError message={adminDashboard.message} />;
  }

  if (adminDashboard.status === "ready") {
    return (
      <ChronosDashboardPage
        activeSessionCount={adminDashboard.activeSessionCount}
        controls={{
          mode: "admin",
          nextPath,
          confirmSessionAction: confirmChronosTimerSession,
          confirmSessionSmoothAction: confirmChronosTimerSessionSmooth,
          createSkillAction: createChronosSkill,
          deleteSkillAction: deleteChronosSkill,
          reorderSkillAction: reorderChronosSkills,
          startAction: startChronosTimer,
          startSmoothAction: startChronosTimerSmooth,
          stopAction: stopChronosTimer,
          stopSmoothAction: stopChronosTimerSmooth,
          updateSkillAction: updateChronosSkill,
        }}
        downtimeSkill={adminDashboard.downtimeSkill}
        idleSession={adminDashboard.idleSession}
        isAuthenticated
        message={actionError}
        pendingSessions={adminDashboard.pendingSessions}
        skills={adminDashboard.skills}
        sortMode={sortMode}
      />
    );
  }

  const { payload } = await getPublicDashboard();
  const hasRealData = hasUsefulPublicDashboardData(payload);
  const skills = hasRealData && payload ? transformPublicDashboardToSkills(payload, sortMode) : chronosSkills;
  const activeSessionCount = hasRealData ? getPublicActiveSessionCount(payload) : 1;

  return <ChronosDashboardPage activeSessionCount={activeSessionCount} controls={{ mode: "login" }} skills={skills} sortMode={sortMode} />;
}
