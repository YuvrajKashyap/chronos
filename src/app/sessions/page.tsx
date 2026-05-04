import { ChronosRoutePage } from "@/components/chronos/chronos-route-page";
import { getChronosAuthState } from "@/lib/chronos/auth-state";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const { isAuthenticated } = await getChronosAuthState();

  return (
    <ChronosRoutePage
      description="Session history will live here. The dashboard remains the primary timer surface."
      eyebrow="Ledger"
      isAuthenticated={isAuthenticated}
      title="Sessions"
    />
  );
}
