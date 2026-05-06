"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { logoutFromChronos } from "@/app/admin/actions";
import { ChronosLoginEmblem } from "@/components/chronos/chronos-login-emblem";

export function UserPill({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <Link className="login-emblem-button" href="/login" aria-label="Login to Chronos admin">
        <ChronosLoginEmblem />
      </Link>
    );
  }

  return (
    <div className="profile-menu">
      <button
        className="profile-emblem-button"
        type="button"
        aria-label="Open profile menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        YK
      </button>
      {isOpen ? (
        <div className="profile-dropdown" role="menu">
          <form action={logoutFromChronos}>
            <button className="profile-dropdown-action" type="submit" role="menuitem">
              <LogOut size={16} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
