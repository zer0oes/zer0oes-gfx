"use client";

// Interrupteur pour les choix oui / non (case à cocher stylée : le formulaire reçoit "on" quand il est activé)
export function Switch({ name, label, defaultChecked, checked, onChange }: { name?: string; label: React.ReactNode; defaultChecked?: boolean; checked?: boolean; onChange?: (checked: boolean) => void }) {
  return <label className="inline-flex cursor-pointer items-center gap-3 text-sm">
    <input type="checkbox" role="switch" name={name} defaultChecked={defaultChecked} checked={checked} onChange={onChange && ((event) => onChange(event.target.checked))} className="peer sr-only" />
    <span aria-hidden className="relative h-6 w-11 shrink-0 rounded-full bg-border transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-foreground after:transition peer-checked:bg-accent peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
    {label}
  </label>;
}
