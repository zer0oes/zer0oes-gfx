// Initialise le carrousel du magasin JSON de développement depuis le même seed
// que Supabase. Ne remplace jamais les textes déjà édités dans l'administration.
import fs from "node:fs/promises";
import { localStore } from "../src/lib/store/local";
import { parseCarouselSlides } from "../src/lib/announcement-carousel";

const existing = await localStore.getCarouselSlides();
if (existing.length) {
  console.log("Carrousel local déjà initialisé : aucun texte modifié.");
} else {
  const sql = await fs.readFile(new URL("../supabase/migrations/20261016000200_announcement_carousel.sql", import.meta.url), "utf8");
  const slides = parseCarouselSlides(JSON.parse(sql.split("$slides$")[1]));
  const audit = slides.find((slide) => slide.id === "audit");
  if (audit) { audit.content.fr.badge = "Audit gratuit"; audit.content.en.badge = "Free audit"; }
  await localStore.saveCarouselSlides(slides);
  console.log("Les deux diapos FR/EN ont été enregistrées dans le magasin JSON local.");
}
