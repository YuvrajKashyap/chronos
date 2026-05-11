import { ChronosDashboardPage } from "@/components/chronos/chronos-dashboard-page";
import { chronosSkills } from "@/lib/chronos-sample-data";
import { getAdminTimerState } from "@/lib/chronos/admin-dashboard";
import { getPublicDashboard } from "@/lib/chronos/public-dashboard";
import {
  getAdminActiveSessionCount,
  transformAdminDashboardToSkills,
  transformAdminDowntimeSkill,
} from "@/lib/chronos/transform-admin-dashboard";
import {
  getPublicActiveSessionCount,
  hasUsefulPublicDashboardData,
  transformPublicDashboardToSkills,
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

async function getAuthenticatedDashboard() {
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

    let { state } = await getAdminTimerState();
    if (!state) {
      return null;
    }

    if (state.skills.length === 0) {
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

      const refreshedState = await getAdminTimerState();
      state = refreshedState.state;
      if (!state) {
        return null;
      }
    }

    return {
      activeSessionCount: getAdminActiveSessionCount(state),
      downtimeSkill: transformAdminDowntimeSkill(state),
      idleSession: state.idle_session,
      pendingSessions: state.pending_sessions ?? [],
      skills: transformAdminDashboardToSkills(state),
    };
  } catch {
    return null;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const actionError = params.error ? decodeURIComponent(params.error) : null;
  const adminDashboard = await getAuthenticatedDashboard();

  if (adminDashboard) {
    return (
      <ChronosDashboardPage
        activeSessionCount={adminDashboard.activeSessionCount}
        controls={{
          mode: "admin",
          nextPath: "/",
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
      />
    );
  }

  const { payload } = await getPublicDashboard();
  const hasRealData = hasUsefulPublicDashboardData(payload);
  const skills = hasRealData && payload ? transformPublicDashboardToSkills(payload) : chronosSkills;
  const activeSessionCount = hasRealData ? getPublicActiveSessionCount(payload) : 1;

  return <ChronosDashboardPage activeSessionCount={activeSessionCount} controls={{ mode: "login" }} skills={skills} />;
}
