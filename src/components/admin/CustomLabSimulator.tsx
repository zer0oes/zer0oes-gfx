"use client";

import { useEffect, useRef, useState } from "react";
import { applySubscriberFields, subscriberAmountLabel, subscriberNameLabel } from "@/lib/custom-lab/subscriberEvent";
import { randomChatBadges, randomChatMessage, randomEventAmount, randomEventName, chatRoleBadges } from "@/lib/custom-lab/eventSimulatorData";
import { toStreamlabsEvent, type Platform } from "@/lib/custom-lab/platformEvents";
import { jsonObject } from "@/lib/custom-lab/model";
import { MaterialIcon } from "./MaterialIcon";

const events = [
  { key: "message", label: "Chat message", icon: "chat_bubble_outline", message: true },
  { key: "follower-latest", label: "Follower event", icon: "favorite_border" },
  { key: "subscriber-latest", label: "Subscriber event", icon: "star_border", sub: true },
  { key: "tip-latest", label: "Tipper event", icon: "euro", amount: "Montant (€)", message: true },
  { key: "cheer-latest", label: "Cheer event", icon: "diamond", amount: "Montant (bits)", message: true },
  { key: "raid-latest", label: "Raid event", icon: "group_add", amount: "Viewers" },
  { key: "purchase-latest", label: "Purchase event", icon: "shopping_cart", amount: "Montant (€)", message: true, item: true },
  { key: "charityCampaignDonation-latest", label: "Charity donation event", icon: "volunteer_activism", amount: "Montant (€)", message: true },
] as const;
type EventForm = { name: string; amount: string; message: string; subType: string; sender: string; item: string; broadcaster: boolean };
const blank = (): EventForm => ({ name: "", amount: "", message: "", subType: "tier1", sender: "", item: "", broadcaster: false });

export function CustomLabSimulator({ platform, dispatch, onStatus }: { platform: Platform; dispatch: (detail: unknown) => void; onStatus: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [forms, setForms] = useState<Record<string, EventForm>>(() => Object.fromEntries(events.map(({ key }) => [key, blank()])));
  const [custom, setCustom] = useState('{\n  "listener": "follower-latest",\n  "event": { "name": "DebugUser", "amount": 1 }\n}');
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (open && event.key === "Escape") { setOpen(false); toggle.current?.focus(); } }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [open]);
  function update(key: string, field: keyof EventForm, value: string | boolean) { setForms((current) => ({ ...current, [key]: { ...current[key], [field]: value } })); }
  function send(listener: string) {
    const form = { ...forms[listener] };
    const name = listener === "message" && form.broadcaster ? "MaChaine" : form.name.trim() || randomEventName();
    const event: Record<string, unknown> = { name, gifted: false, id: crypto.randomUUID() };
    if (listener === "message") event.data = { time: Date.now(), nick: name.toLowerCase(), userId: crypto.randomUUID(), displayName: name, displayColor: "#9f75ff", badges: form.broadcaster ? [chatRoleBadges.broadcaster] : randomChatBadges(), text: form.message.trim() || randomChatMessage(), isAction: false, emotes: [] };
    else {
      event.amount = form.amount.trim() ? Math.max(0, Number(form.amount) || 0) : randomEventAmount(listener);
      event.message = form.message;
      if (listener === "raid-latest") event.viewers = event.amount;
      if (listener === "purchase-latest") event.items = [{ name: form.item || "T-shirt zer0oes", quantity: 1, price: event.amount }];
      if (listener === "subscriber-latest") applySubscriberFields(event, name, form);
    }
    const detail = { listener, event };
    dispatch(platform === "streamlabs" ? toStreamlabsEvent(detail) : detail);
    onStatus(`${listener} · ${name}`);
  }
  return <>
    {open && <section className="cl-simulator" aria-labelledby="cl-simulator-title" id="cl-simulator">
      <header className="cl-panel-heading"><div><span className="cl-eyebrow">SIMULATION LOCALE</span><h2 id="cl-simulator-title">Déclencher un événement</h2></div><button type="button" className="cl-icon-button" aria-label="Fermer la simulation" onClick={() => { setOpen(false); toggle.current?.focus(); }}><MaterialIcon name="close" className="size-5" /></button></header>
      <div className="cl-simulator-body"><p className="cl-field-label">Événement</p>{events.map((entry) => {
        const form = forms[entry.key];
        const sub = "sub" in entry;
        return <details key={entry.key} className="cl-event-item" open={entry.key === "message" ? true : undefined}><summary><MaterialIcon name={entry.icon} className="size-4" />{entry.label}<span className="cl-chevron inline-flex"><MaterialIcon name="expand_more" className="size-4" /></span></summary><div className="cl-event-body">
          <label>{sub ? subscriberNameLabel(form.subType) : "Pseudo"}<input value={form.name} placeholder="Aléatoire si vide" onChange={(e) => update(entry.key, "name", e.target.value)} /></label>
          {entry.key === "message" && <label className="cl-checkbox">Diffuseur (pseudo de la chaîne)<input type="checkbox" checked={form.broadcaster} onChange={(e) => update(entry.key, "broadcaster", e.target.checked)} /></label>}
          {sub && <label>Type d’abonnement<select value={form.subType} onChange={(e) => update(entry.key, "subType", e.target.value)}><option value="tier1">Sub classique</option><option value="prime">Sub Prime</option><option value="gift">Sub-Gift</option><option value="communitygift">Community Gift</option></select></label>}
          {sub && form.subType === "gift" && <label>Offert par<input value={form.sender} placeholder="Aléatoire si vide" onChange={(e) => update(entry.key, "sender", e.target.value)} /></label>}
          {(sub ? subscriberAmountLabel(form.subType) : "amount" in entry ? entry.amount : null) && <label>{sub ? subscriberAmountLabel(form.subType) : "amount" in entry ? entry.amount : ""}<input type="number" min="0" value={form.amount} placeholder="Aléatoire si vide" onChange={(e) => update(entry.key, "amount", e.target.value)} /></label>}
          {"item" in entry && <label>Article<input value={form.item} placeholder="T-shirt zer0oes" onChange={(e) => update(entry.key, "item", e.target.value)} /></label>}
          {"message" in entry && <label>Message<input value={form.message} placeholder="Aléatoire si vide" onChange={(e) => update(entry.key, "message", e.target.value)} /></label>}
          <button type="button" className="cl-primary" onClick={() => send(entry.key)}>Déclencher l’événement</button>
        </div></details>;
      })}</div>
      <details className="cl-advanced"><summary>Événement JSON personnalisé</summary><label>Detail de onEventReceived<textarea aria-label="Événement JSON personnalisé" rows={7} spellCheck={false} value={custom} onChange={(e) => setCustom(e.target.value)} /></label><button type="button" className="cl-secondary" onClick={() => { try { dispatch(jsonObject(custom)); } catch { onStatus("Événement JSON invalide."); } }}>Envoyer le JSON</button></details>
    </section>}
    <button ref={toggle} type="button" className="cl-event-fab" aria-label="Simuler un événement" title="Simuler un événement" aria-expanded={open} aria-controls="cl-simulator" onClick={() => setOpen(!open)}><MaterialIcon name="alarm" className="size-[26px]" /></button>
  </>;
}
