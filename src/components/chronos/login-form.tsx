"use client";

import { useActionState } from "react";

import { signInToChronos, type LoginFormState } from "@/app/login/actions";

export function LoginForm() {
  const initialState: LoginFormState = { error: null, username: "" };
  const [state, formAction, isPending] = useActionState(signInToChronos, initialState);

  return (
    <form className="auth-form" action={formAction}>
      <div className="auth-field-stack">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          autoCapitalize="none"
          autoComplete="username"
          defaultValue={state.username}
          placeholder="yuvraj"
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
      <p className={state.error ? "auth-message is-error" : "auth-message"}>
        {state.error ?? "Private Chronos control access."}
      </p>
    </form>
  );
}
