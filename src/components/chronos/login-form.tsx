"use client";

import { useState } from "react";

import { createChronosBrowserClient } from "@/lib/supabase/client";

type LoginState = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<LoginState>("idle");
  const [message, setMessage] = useState("Only the authorized Chronos owner email can access admin.");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setMessage("Preparing secure magic link...");

    try {
      const supabase = createChronosBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
          shouldCreateUser: true,
        },
      });

      if (error) {
        setState("error");
        setMessage(error.message);
        return;
      }

      setState("sent");
      setMessage("Magic link sent. Open it from this browser to enter the Chronos admin shell.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to send login link.");
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label htmlFor="email">Owner email</label>
      <div className="auth-input-row">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
        <button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending" : "Send link"}
        </button>
      </div>
      <p className={state === "error" ? "auth-message is-error" : "auth-message"}>{message}</p>
    </form>
  );
}
