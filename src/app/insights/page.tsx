import { ChronosInsightsPage } from "@/components/chronos/chronos-insights-page";
import { getChronosAuthState } from "@/lib/chronos/auth-state";
import { getChronosInsights } from "@/lib/chronos/insights";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const { isAuthenticated } = await getChronosAuthState();

  if (!isAuthenticated) {
    redirect("/login?next=%2Finsights");
  }

  const insights = await getChronosInsights(isAuthenticated);

  return <ChronosInsightsPage insights={insights} isAuthenticated={isAuthenticated} />;
}
