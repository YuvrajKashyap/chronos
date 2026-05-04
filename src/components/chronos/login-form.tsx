"use client";

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
        <input
          id="chronos-access-name"
          name="chronos-access-name"
          type="text"
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Enter username"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          required
        />
      </div>
      <button className="auth-submit-button" type="submit" disabled={isPending}>
        {isPending ? "Signing in" : "Sign in"}
      </button>
      <p className={error ? "auth-message is-error" : "auth-message"}>
        {error ?? "Private Chronos control access."}
      </p>
    </form>
  );
}
