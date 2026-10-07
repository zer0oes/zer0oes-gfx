"use client";

import { useActionState } from "react";
import { saveClientTestimonialAction } from "@/app/(livraison)/commande/actions";
import type { ClientTestimonial } from "@/lib/store/types";

export function ClientTestimonialForm({ token, testimonial, en }: { token: string; testimonial?: ClientTestimonial; en: boolean }) {
  const [state, action, pending] = useActionState(saveClientTestimonialAction, { status: "" });
  const messages: Record<string, string> = en ? {
    saved: "Thank you! Your review and publication preference have been saved.",
    invalid: "Enter a name (up to 80 characters) and a review (up to 600 characters).",
    unapproved: "Please approve all deliverables before submitting your review.",
    error: "Your review could not be saved. Please try again.",
  } : {
    saved: "Merci ! Ton avis et ton choix de diffusion ont été enregistrés.",
    invalid: "Renseigne un nom (80 caractères maximum) et un avis (600 caractères maximum).",
    unapproved: "Valide tous les livrables avant d’envoyer ton avis.",
    error: "Ton avis n’a pas pu être enregistré. Réessaie.",
  };
  const field = "mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm";
  return (
    <section id="avis" aria-labelledby="avis-title" className="mt-8 rounded-2xl border border-border bg-background p-4 sm:p-5">
      <h2 id="avis-title" className="font-display text-xl font-bold">{en ? "Share your experience" : "Partage ton expérience"}</h2>
      <p className="mt-2 text-sm text-muted">{en ? "Your review is optional. It will only be published on the zer0oes gfx website with your permission, after review." : "Ton avis est facultatif. Il pourra être publié sur le site zer0oes gfx uniquement avec ton accord, après relecture."}</p>
      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="token" value={token} />
        <label className="block text-sm" htmlFor="review-author">{en ? "Public name / username" : "Nom / pseudo à afficher"}
          <input id="review-author" name="author" required maxLength={80} defaultValue={testimonial?.author ?? ""} className={field} />
        </label>
        <label className="block text-sm" htmlFor="review-quote">{en ? "Your review (up to 600 characters)" : "Ton témoignage (600 caractères maximum)"}
          <textarea id="review-quote" name="quote" required maxLength={600} rows={5} defaultValue={testimonial?.quote ?? ""} className={field} />
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="consent" defaultChecked={testimonial?.consent ?? false} className="mt-1" />
          <span>{en ? "I authorize zer0oes gfx to publish this review and the name / username entered above on its website (home page and portfolio)." : "J’autorise zer0oes gfx à diffuser ce témoignage et le nom / pseudo renseigné ci-dessus sur son site (accueil et portfolio)."}</span>
        </label>
        <p className="text-xs text-muted">{en ? "Without permission, your review stays private. To withdraw permission after publication, contact zer0oes gfx." : "Sans accord, ton avis reste privé. Pour retirer ton accord après publication, contacte zer0oes gfx."}</p>
        <p role="status" aria-live="polite" className="text-sm">{messages[state.status]}</p>
        <button disabled={pending} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-50">{pending ? (en ? "Saving…" : "Enregistrement…") : testimonial ? (en ? "Update my review" : "Mettre à jour mon avis") : (en ? "Send my review" : "Envoyer mon avis")}</button>
      </form>
    </section>
  );
}
