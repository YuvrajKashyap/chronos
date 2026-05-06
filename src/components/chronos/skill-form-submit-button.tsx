"use client";

import { useFormStatus } from "react-dom";

export function SkillFormSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="skill-modal-primary" type="submit" disabled={pending}>
      {pending ? "Saving" : label}
    </button>
  );
}
