"use client";

import { ArrowRight, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
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

      <div className="auth-form-options">
        <label className="auth-remember-control">
          <input type="checkbox" name="remember" />
          <span aria-hidden="true" />
          Remember me
        </label>
        <button className="auth-forgot-button" type="button">
          Forgot password?
        </button>
      </div>

      <button className="auth-submit-button" type="submit" disabled={isPending}>
        <LockKeyhole size={18} aria-hidden="true" />
        <span>{isPending ? "Signing in" : "Sign in"}</span>
        <ArrowRight size={20} aria-hidden="true" />
      </button>
      <p className={error ? "auth-message is-error" : "auth-message"}>
        {error ?? (
          <>
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Your data is private and encrypted.</span>
          </>
        )}
      </p>
    </form>
  );
}
