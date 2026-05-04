import { ChronosDashboardPage } from "@/components/chronos/chronos-dashboard-page";
import { chronosSkills } from "@/lib/chronos-sample-data";
import { getPublicDashboard } from "@/lib/chronos/public-dashboard";
import {
  getPublicActiveSessionCount,
  hasUsefulPublicDashboardData,
  transformPublicDashboardToSkills,
} from "@/lib/chronos/transform-dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { payload } = await getPublicDashboard();
  const hasRealData = hasUsefulPublicDashboardData(payload);
  const skills = hasRealData && payload ? transformPublicDashboardToSkills(payload) : chronosSkills;
  const activeSessionCount = hasRealData ? getPublicActiveSessionCount(payload) : 1;

  return <ChronosDashboardPage activeSessionCount={activeSessionCount} skills={skills} />;
}
