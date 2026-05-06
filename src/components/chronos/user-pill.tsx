"use client";

import Link from "next/link";

import { logoutFromChronosToDashboard } from "@/app/admin/actions";
import { ChronosLoginEmblem } from "@/components/chronos/chronos-login-emblem";

export function UserPill({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (!isAuthenticated) {
    return (
      <Link className="login-emblem-button" href="/login" aria-label="Open Chronos login">
        <ChronosLoginEmblem />
      </Link>
    );
  }

  return (
    <form className="profile-emblem-form" action={logoutFromChronosToDashboard}>
      <button className="login-emblem-button" type="submit" aria-label="Log out of Chronos">
        <ChronosLoginEmblem />
      </button>
    </form>
  );
}
