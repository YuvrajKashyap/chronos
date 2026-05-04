"use client";

import { useFormStatus } from "react-dom";

export function AdminSubmitButton({
  children,
  pendingLabel,
  className = "auth-primary-link",
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending || disabled}>
      {pending ? pendingLabel : children}
    </button>
  );
}
