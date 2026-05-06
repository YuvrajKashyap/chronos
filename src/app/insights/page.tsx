import { ChronosInsightsPage } from "@/components/chronos/chronos-insights-page";
import { getChronosAuthState } from "@/lib/chronos/auth-state";
import { getChronosInsights } from "@/lib/chronos/insights";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const { isAuthenticated } = await getChronosAuthState();
  const insights = await getChronosInsights(isAuthenticated);

  return <ChronosInsightsPage insights={insights} isAuthenticated={isAuthenticated} />;
}
