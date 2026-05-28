import { ChronosRoutePage } from "@/components/chronos/chronos-route-page";
import { getChronosAuthState } from "@/lib/chronos/auth-state";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { isAuthenticated } = await getChronosAuthState();

  return (
    <ChronosRoutePage
      description="Account, visibility, downtime, and dashboard preferences will be managed here."
      eyebrow="Configuration"
      isAuthenticated={isAuthenticated}
      title="Settings"
    />
  );
}
