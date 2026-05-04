import Link from "next/link";
import { redirect } from "next/navigation";

import { ChronosShell } from "@/components/chronos/chronos-shell";
import { createChronosServerClient } from "@/lib/supabase/server";
import { logoutFromChronos } from "./actions";

export const dynamic = "force-dynamic";

type BootstrapPayload = {
  email?: string;
  display_name?: string | null;
  access_status?: string;
  is_owner?: boolean;
};

function LogoutButton() {
  return (
    <form action={logoutFromChronos}>
      <button className="auth-outline-button" type="submit">
        Logout
      </button>
    </form>
  );
}

function AdminStatusPanel({
  email,
  bootstrap,
  error,
}: {
  email: string;
  bootstrap?: BootstrapPayload | null;
  error?: string | null;
}) {
  const isDenied = Boolean(error);

  return (
    <ChronosShell>
      <main className="auth-main">
        <section className={isDenied ? "auth-panel admin-panel is-denied" : "auth-panel admin-panel"} aria-labelledby="admin-title">
          <p className="auth-kicker">{isDenied ? "Access denied" : "Owner control shell"}</p>
          <h1 id="admin-title">{isDenied ? "Chronos Admin Blocked" : "Chronos Admin"}</h1>
          <p className="auth-copy">
            {isDenied
              ? "Supabase Auth succeeded, but Chronos bootstrap rejected this account."
              : "The private time-investment ledger is authenticated and ready for timer controls."}
          </p>

          <div className="admin-status-grid">
            <div>
              <span>Signed in as</span>
              <strong>{email}</strong>
            </div>
            <div>
              <span>Bootstrap</span>
              <strong>{isDenied ? "Rejected" : "Allowed"}</strong>
            </div>
            <div>
              <span>Access status</span>
              <strong>{bootstrap?.access_status ?? (isDenied ? "Unavailable" : "Active")}</strong>
            </div>
            <div>
              <span>Timer controls</span>
              <strong>Next step</strong>
            </div>
          </div>

          {error ? <p className="auth-message is-error">{error}</p> : null}
          {!error ? <p className="auth-message">Timer start/stop, session editing, skills, settings, and insights come next.</p> : null}

          <div className="auth-actions">
            <Link className="auth-primary-link" href="/">
              Public dashboard
            </Link>
            <LogoutButton />
          </div>
        </section>
      </main>
    </ChronosShell>
  );
}

export default async function AdminPage() {
  let supabase;

  try {
    supabase = await createChronosServerClient();
  } catch (error) {
    return (
      <AdminStatusPanel
        email="Not available"
        error={error instanceof Error ? error.message : "Supabase is not configured."}
      />
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase.rpc("bootstrap_current_user");

  return (
    <AdminStatusPanel
      email={user.email ?? "Unknown email"}
      bootstrap={(data as BootstrapPayload | null) ?? null}
      error={error?.message ?? null}
    />
  );
}
