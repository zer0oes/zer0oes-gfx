// Champs spécifiques au "Subscriber event" des simulateurs (éditeur widget et
// canevas d'overlay) : reproduit la forme des évènements StreamElements pour
// un sub classique/Prime (amount = mois cumulés), un Sub-Gift (name =
// destinataire, sender = gifteur) et un Community Gift (name = sender =
// gifteur, amount = nombre de subs offerts, bulkGifted).
import { randomEventName } from "./eventSimulatorData";

export interface SubscriberForm {
  subType: string;
  // string | number : v-model sur un <input type="number"> renvoie un nombre
  amount: string | number;
  sender: string;
}

export function subscriberNameLabel(subType: string): string {
  if (subType === "gift") return "Destinataire";
  if (subType === "communitygift") return "Gifteur";
  return "Pseudo";
}

// null : pas de champ nombre (un Sub-Gift offre toujours un seul sub)
export function subscriberAmountLabel(subType: string): string | null {
  if (subType === "gift") return null;
  if (subType === "communitygift") return "Nombre de subs offerts";
  return "Mois cumulés";
}

export function applySubscriberFields(event: Record<string, unknown>, name: string, form: SubscriberForm): void {
  const { subType } = form;
  event.subType = subType;
  event.tier = subType === "prime" ? "prime" : "1000";
  event.gifted = subType === "gift" || subType === "communitygift";
  event.bulkGifted = subType === "communitygift";

  const raw = String(form.amount ?? "").trim();
  const typed = Math.max(1, Math.round(Number(raw) || 0));

  if (subType === "gift") {
    let sender = form.sender.trim();
    while (!sender || sender === name) sender = randomEventName();
    event.sender = sender;
    event.amount = 1;
    return;
  }

  if (subType === "communitygift") {
    const amount = raw === "" ? Math.floor(Math.random() * 20) + 2 : typed;
    form.amount = String(amount);
    event.sender = name;
    event.amount = amount;
    return;
  }

  event.amount = raw === "" ? 1 : typed;
}
