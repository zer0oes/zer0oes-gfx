import assert from "node:assert/strict";
import { test } from "node:test";
import { parseContact } from "./contact-form";

const form = (values: Record<string, string | string[]>) => {
  const all = (k: string) => {
    const v = values[k];
    return v === undefined ? [] : Array.isArray(v) ? v : [v];
  };
  return [(k: string) => all(k)[0] ?? "", all] as const;
};

const base = { name: "Zoé", email: "zoe@exemple.fr", message: "Un overlay néon pour mes lives" };

test("demande complète : choix filtrés et mis en forme", () => {
  const r = parseContact(
    ...form({
      ...base,
      type: "Devis Univers complet",
      platforms: ["Twitch", "TikTok", "MySpace"],
      budget: "500 à 1 000 €",
      identity: "Partiellement",
      assets: ["Logo", "Charte graphique"],
      style: ["Néon", "Autre"],
      styleOther: "cyberpunk pastel",
      colors: "violet, pas de jaune",
      references: "https://exemple.fr/a\n\n  https://exemple.fr/b ",
      filesLater: "1",
      referral: "Recommandation",
    }),
  );
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.request.fields.Plateformes, "Twitch, TikTok");
  assert.equal(r.request.fields["Style recherché"], "Néon, cyberpunk pastel");
  assert.equal(r.request.fields.Inspirations, "https://exemple.fr/a\nhttps://exemple.fr/b");
  assert.equal(r.request.fields["Fichiers envoyés après la prise de contact"], "Oui");
  assert.equal(r.request.fields["M'a trouvée via"], "Recommandation");
  assert.equal(r.request.type, "Devis Univers complet");
});

test("champs obligatoires, valeurs inconnues et liens invalides", () => {
  assert.equal(parseContact(...form({ ...base, email: "pas-un-mail" })).ok, false);
  assert.equal(parseContact(...form({ ...base, references: "javascript:alert(1)" })).ok, false);
  assert.equal(parseContact(...form({ ...base, references: Array(6).fill("https://a.fr").join("\n") })).ok, false);
  const r = parseContact(...form({ ...base, type: "<script>", budget: "1 million", identity: "peut-être", referral: "Facebook" }));
  assert.ok(r.ok && r.request.type === "Projet sur mesure" && r.request.fields.Budget === "Je ne sais pas encore");
  assert.ok(r.ok && r.request.fields["Identité visuelle existante"] === "" && r.request.fields["M'a trouvée via"] === "");
});
