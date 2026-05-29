import { ChronosRoutePage } from "@/components/chronos/chronos-route-page";
import { getChronosAuthState } from "@/lib/chronos/auth-state";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { isAuthenticated } = await getChronosAuthState();

  if (!isAuthenticated) {
    redirect("/login?next=%2Fsettings");
  }

  return (
    <ChronosRoutePage
      description="Account, visibility, downtime, and dashboard preferences will be managed here."
      eyebrow="Configuration"
      isAuthenticated={isAuthenticated}
      title="Settings"
    />
  );
}
