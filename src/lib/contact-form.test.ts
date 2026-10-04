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
      assets: ["Logo", "Couleurs"],
      style: ["Néon", "Autre"],
      styleOther: "cyberpunk pastel",
      references: ["https://exemple.fr/a", "", "https://exemple.fr/b"],
    }),
  );
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.request.fields.Plateformes, "Twitch, TikTok");
  assert.equal(r.request.fields["Style recherché"], "Néon, cyberpunk pastel");
  assert.equal(r.request.fields.Références, "https://exemple.fr/a\nhttps://exemple.fr/b");
  assert.equal(r.request.type, "Devis Univers complet");
});

test("champs obligatoires, valeurs inconnues et liens invalides", () => {
  assert.equal(parseContact(...form({ ...base, email: "pas-un-mail" })).ok, false);
  assert.equal(parseContact(...form({ ...base, references: "javascript:alert(1)" })).ok, false);
  const r = parseContact(...form({ ...base, type: "<script>", budget: "1 million", identity: "peut-être" }));
  assert.ok(r.ok && r.request.type === "Projet sur mesure" && r.request.fields.Budget === "Je ne sais pas encore" && r.request.fields["Identité visuelle existante"] === "");
});
