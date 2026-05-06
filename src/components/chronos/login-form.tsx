"use client";

import { ArrowRight, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useActionState } from "react";

import { signInToChronos, type LoginFormState } from "@/app/login/actions";

export function LoginForm() {
  const initialState: LoginFormState = { error: null };
  const [state, formAction, isPending] = useActionState(signInToChronos, initialState);
  const error = state?.error ?? null;

  return (
    <form className="auth-form" action={formAction} autoComplete="off">
      <div className="auth-field-stack">
        <label htmlFor="chronos-access-name">Username</label>
        <div className="auth-field-shell">
          <UserRound size={19} aria-hidden="true" />
          <input
            id="chronos-access-name"
            name="chronos-access-name"
            type="text"
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Access name"
            required
          />
        </div>

        <label htmlFor="password">Password</label>
        <div className="auth-field-shell">
          <LockKeyhole size={19} aria-hidden="true" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            required
          />
          <EyeOff className="auth-field-end-icon" size={19} aria-hidden="true" />
        </div>
      </div>

      <button className="auth-submit-button" type="submit" disabled={isPending}>
        <span className="auth-submit-orb" aria-hidden="true">
          <LockKeyhole size={18} />
        </span>
        <span>{isPending ? "Signing in" : "Sign in"}</span>
        <ArrowRight className="auth-submit-arrow" size={21} aria-hidden="true" />
      </button>
      {error ? <p className="auth-message is-error">{error}</p> : null}
    </form>
  );
}
