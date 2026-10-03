// Ventes fictives pour le tableau de bord, affichées (avec un bandeau « exemple ») tant
// qu'aucune vente réelle n'existe. Déterministes : mêmes données à chaque affichage.
import { addDays } from "@/lib/dashboard";
import type { Order } from "@/lib/store/types";

const offers = [
  { name: "Premier look — Essentiel", price: 49000 },
  { name: "Premier look — Complet", price: 64000 },
  { name: "Identité signature — Essentielle", price: 99000 },
  { name: "Identité signature — Standard", price: 127000 },
  { name: "Identité signature — Complète", price: 172000 },
  { name: "Univers complet (devis)", price: 249000 },
];

// Générateur pseudo-aléatoire reproductible (mulberry32)
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// today : AAAA-MM-JJ. Environ 15 mois de ventes jusqu'à aujourd'hui.
export function demoOrders(today: string): Order[] {
  const rnd = random(20261003);
  const orders: Order[] = [];
  const at = (day: string) => `${day}T${String(9 + Math.floor(rnd() * 10)).padStart(2, "0")}:00:00.000Z`;
  let day = addDays(today, -460);
  let n = 0;
  while (day <= today) {
    day = addDays(day, 3 + Math.floor(rnd() * 9));
    if (day > today) break;
    n++;
    const offer = offers[Math.min(offers.length - 1, Math.floor(rnd() * rnd() * offers.length * 1.6))];
    const acompte = rnd() < 0.6;
    const deposit = Math.round(offer.price * 0.3);
    const balanceDay = addDays(day, 15 + Math.floor(rnd() * 30));
    const balancePaid = acompte && balanceDay <= today;
    const amountPaid = acompte ? (balancePaid ? offer.price : deposit) : offer.price;
    const refunded = n % 17 === 0;
    const createdAt = at(day);
    orders.push({
      id: `exemple-${n}`,
      createdAt,
      updatedAt: createdAt,
      stripeSessionId: `exemple_${n}`,
      demo: true,
      packId: "exemple",
      formulaId: "exemple",
      offerName: offer.name,
      paymentType: acompte ? "acompte" : "total",
      hasLogo: false,
      listPrice: offer.price,
      totalPrice: offer.price,
      amountPaid,
      depositPercent: 30,
      logoDiscount: 0,
      customerName: `Streamer ${n}`,
      customerEmail: `streamer${n}@exemple.fr`,
      status: balancePaid || !acompte ? "terminee" : "en_cours",
      balancePaidAt: balancePaid ? at(balanceDay) : undefined,
      notes: [],
      refunds: refunded ? [{ id: `re_exemple_${n}`, amount: amountPaid, at: at(addDays(day, 6) <= today ? addDays(day, 6) : today) }] : [],
    });
  }
  return orders;
}
