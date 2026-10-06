import assert from "node:assert/strict";
import { test } from "node:test";
import { Children, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { aboutFields, resolveAbout } from "./about-content";
import { documentKey, renderDocumentText, saveDocumentFields } from "./editable-document";
import { legalDocument, legalPages } from "./legal-content";
import { homeFromForm, resetGroup, resolveHome } from "./home-content";

test("les portraits sont indépendants, communs aux langues et réinitialisables", () => {
  const defaults = { fr: aboutFields("fr"), en: aboutFields("en") };
  const form = new FormData();
  form.set("p:image.src", "/portfolio/portrait.webp");
  form.set("en:p:image.src", "/portfolio/ignored.webp");
  const saved = saveDocumentFields({ "about.image": "/portfolio/avatar.webp" }, "a-propos", form, defaults);
  for (const locale of ["fr", "en"] as const) {
    assert.equal(resolveAbout(saved, locale).text("image.src"), "/portfolio/portrait.webp");
    assert.equal(resolveHome(saved, locale).text("about.image"), "/portfolio/avatar.webp");
  }
  const home = homeFromForm((key) => key === "about.image" ? "" : undefined, saved);
  assert.equal(resolveHome(home).text("about.image"), "/a-propos/zer0oes-avatar.webp");
  assert.equal(resolveAbout(home, "en").text("image.src"), "/portfolio/portrait.webp");
  form.set("p:image.src", "");
  assert.equal(resolveAbout(saveDocumentFields(saved, "a-propos", form, defaults), "en").text("image.src"), "/a-propos/aurore.webp");
});

const settings = { depositPercent: 30, logoDiscount: 15000, deliveryDays: "7 à 14" };
function text(node: ReactNode): string {
  return Children.toArray(node).map((child) => isValidElement<{ children?: ReactNode }>(child) ? text(child.props.children) : String(child)).join("");
}

test("À propos : tous les chapitres et textes sont disponibles dans les deux langues", () => {
  assert.deepEqual(aboutFields("fr").map((field) => field.key), aboutFields("en").map((field) => field.key));
  assert.equal(aboutFields("fr").filter((field) => field.key.startsWith("chapter.")).length, 10);
  const stored = { [documentKey("a-propos", "fr", "chapter.0.title")]: "Mon parcours", [documentKey("a-propos", "en", "chapter.0.title")]: "My story" };
  assert.equal(resolveAbout(stored, "fr").text("chapter.0.title"), "Mon parcours");
  assert.equal(resolveAbout(stored, "en").text("chapter.0.title"), "My story");
  assert.equal(resolveAbout(null, "en").text("cta.button"), "Let's talk about your project");
});

test("les pages légales exposent les mêmes champs FR/EN, y compris les listes et cellules de tableaux", () => {
  for (const page of legalPages) {
    const fr = legalDocument(page.id, "fr", settings).fields;
    const en = legalDocument(page.id, "en", settings).fields;
    assert.deepEqual(fr.map((field) => field.key), en.map((field) => field.key), page.id);
    assert.ok(fr.some((field) => field.key === "header.title"));
    assert.ok(fr.some((field) => field.key.startsWith("h2.")));
    assert.ok(fr.some((field) => field.key.startsWith("p.")));
  }
  const privacy = legalDocument("confidentialite", "fr", settings).fields;
  assert.equal(privacy.filter((field) => field.key.startsWith("td.")).length, 33);
  assert.equal(privacy.filter((field) => field.key.startsWith("th.")).length, 5);
  assert.ok(privacy.some((field) => field.value.includes("**Formulaire de contact**")));
});

test("la sauvegarde isole les pages et langues, filtre les clés, et retire les valeurs d’origine", () => {
  const defaults = { fr: legalDocument("cgv", "fr", settings).fields, en: legalDocument("cgv", "en", settings).fields };
  const stored = { "hero.title1": "Mon stream", "page:a-propos:fr:kicker": "Mon histoire", "page:mentions-legales:en:header.title": "Notice" };
  const form = new FormData();
  form.set("p:header.title", "Mes conditions");
  form.set("en:p:header.title", "My terms");
  form.set("p:unknown", "ignored");
  const saved = saveDocumentFields(stored, "cgv", form, defaults);
  assert.deepEqual(saved, { ...stored, "page:cgv:fr:header.title": "Mes conditions", "page:cgv:en:header.title": "My terms" });
  form.set("p:header.title", defaults.fr[0].value);
  form.set("en:p:header.title", "");
  assert.deepEqual(saveDocumentFields(saved, "cgv", form, defaults), stored);
  assert.equal(homeFromForm(() => undefined, saved)["page:cgv:en:header.title"], "My terms");
  assert.equal(resetGroup(saved, "accueil")?.["page:cgv:fr:header.title"], "Mes conditions");
});

test("les paragraphes personnalisés conservent les valeurs dynamiques des réglages", () => {
  const stored = { "page:cgv:fr:li.0": "Acompte : {{settings.depositPercent}} %." };
  const current = legalDocument("cgv", "fr", { ...settings, depositPercent: 45 }, stored);
  assert.match(text(current.content), /Acompte : 45 %\./);
  const defaults = legalDocument("mentions-legales", "fr", settings).fields;
  assert.ok(defaults.some((field) => field.value.includes("{{legal.siret}}")));
  assert.ok(defaults.some((field) => field.value.includes("mailto:{{site.email}}")));
});

test("le format riche conserve le gras et les liens sûrs, sans interpréter du HTML ou javascript", () => {
  const nodes = renderDocumentText('**Important**\n[Contact](mailto:{{site.email}}) [Unsafe](javascript:alert) <script>alert(1)</script>', { "site.email": "test@example.com" });
  const elements = nodes.filter(isValidElement<{ href?: string; children?: ReactNode }>);
  assert.ok(elements.some((node) => node.type === "strong"));
  assert.ok(elements.some((node) => node.type === "br"));
  assert.equal(elements.find((node) => node.type === "a")?.props.href, "mailto:test@example.com");
  assert.ok(elements.every((node) => !node.props.href?.startsWith("javascript:")));
  assert.match(text(nodes), /<script>alert\(1\)<\/script>/);
});

test("le rendu public conserve les tableaux, les liens et les valeurs dynamiques", () => {
  const privacy = renderToStaticMarkup(legalDocument("confidentialite", "fr", settings).content);
  assert.equal((privacy.match(/<table>/g) ?? []).length, 2);
  assert.equal((privacy.match(/<td>/g) ?? []).length, 33);
  assert.match(privacy, /href="\/mentions-legales"/);
  const stored = { "page:cgv:en:header.title": "My terms", "page:cgv:en:li.0": "Deposit: {{settings.depositPercent}}%. <script>bad</script>" };
  const terms = renderToStaticMarkup(legalDocument("cgv", "en", { ...settings, depositPercent: 40 }, stored).content);
  assert.match(terms, />My terms<\/h1>/);
  assert.match(terms, /Deposit: 40%\./);
  assert.match(terms, /&lt;script&gt;bad&lt;\/script&gt;/);
  assert.doesNotMatch(terms, /<script>bad/);
});
