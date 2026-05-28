import { ChronosDashboardPage } from "@/components/chronos/chronos-dashboard-page";
import { chronosSkills } from "@/lib/chronos-sample-data";
import { getAdminTimerState } from "@/lib/chronos/admin-dashboard";
import { getPublicDashboard } from "@/lib/chronos/public-dashboard";
import { getAdminActiveSessionCount, transformAdminDashboardToSkills } from "@/lib/chronos/transform-admin-dashboard";
import {
  type DashboardSortMode,
  getPublicActiveSessionCount,
  hasUsefulPublicDashboardData,
  parseDashboardSortMode,
  transformPublicDashboardToSkills,
} from "@/lib/chronos/transform-dashboard";
import { createChronosServerClient } from "@/lib/supabase/server";
import {
  confirmChronosTimerSession,
  createChronosSkill,
  deleteChronosSkill,
  reorderChronosSkills,
  startChronosTimer,
  stopChronosTimer,
  updateChronosSkill,
} from "./admin/actions";

export const dynamic = "force-dynamic";

function getDashboardNextPath(pathname: "/" | "/admin", requestedSortMode: string | undefined, sortMode: DashboardSortMode) {
  return requestedSortMode ? `${pathname}?sort=${sortMode}` : pathname;
}

async function getAuthenticatedDashboard(sortMode: DashboardSortMode) {
  try {
    const supabase = await createChronosServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { error: bootstrapError } = await supabase.rpc("bootstrap_current_user");
    if (bootstrapError) {
      return null;
    }

    const { data: defaultSkillsData, error: defaultSkillsError } = await supabase.rpc("ensure_default_skills");
    if (
      defaultSkillsError ||
      (defaultSkillsData &&
        typeof defaultSkillsData === "object" &&
        "success" in defaultSkillsData &&
        defaultSkillsData.success === false)
    ) {
      return null;
    }

    const { state } = await getAdminTimerState();
    if (!state) {
      return null;
    }

    return {
      activeSessionCount: getAdminActiveSessionCount(state),
      pendingSessions: state.pending_sessions ?? [],
      skills: transformAdminDashboardToSkills(state, sortMode),
    };
  } catch {
    return null;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const sortMode = parseDashboardSortMode(params.sort);
  const actionError = params.error ? decodeURIComponent(params.error) : null;
  const adminDashboard = await getAuthenticatedDashboard(sortMode);

  if (adminDashboard) {
    return (
      <ChronosDashboardPage
        activeSessionCount={adminDashboard.activeSessionCount}
        controls={{
          mode: "admin",
          nextPath: getDashboardNextPath("/", params.sort, sortMode),
          confirmSessionAction: confirmChronosTimerSession,
          createSkillAction: createChronosSkill,
          deleteSkillAction: deleteChronosSkill,
          reorderSkillAction: reorderChronosSkills,
          startAction: startChronosTimer,
          stopAction: stopChronosTimer,
          updateSkillAction: updateChronosSkill,
        }}
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

  return (
    <ChronosDashboardPage
      activeSessionCount={activeSessionCount}
      controls={{ mode: "login" }}
      skills={skills}
      sortMode={sortMode}
    />
  );
}
