import Stripe from "stripe";

let client: Stripe | null = null;

// Renvoie null tant que STRIPE_SECRET_KEY n'est pas configurée :
// le site fonctionne alors en mode démo (pas de paiement réel).
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}
