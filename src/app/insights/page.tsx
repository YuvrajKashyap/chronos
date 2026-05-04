import { ChronosRoutePage } from "@/components/chronos/chronos-route-page";
import { getChronosAuthState } from "@/lib/chronos/auth-state";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const { isAuthenticated } = await getChronosAuthState();

  return (
    <ChronosRoutePage
      description="Private analysis and public proof-of-work insight views will be added here."
      eyebrow="Analysis"
      isAuthenticated={isAuthenticated}
      title="Insights"
    />
  );
}
