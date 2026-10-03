"use client";

import { useActionState } from "react";
import { sendMagicLink } from "@/app/admin/actions";
import { FormStatus, inputClass } from "@/components/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(sendMagicLink, null);
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">E-mail</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <FormStatus state={state} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent px-5 py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Recevoir un lien de connexion"}
      </button>
    </form>
  );
}
