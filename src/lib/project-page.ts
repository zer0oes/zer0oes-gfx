import "server-only";
import { caseStudies } from "@/data/case-studies";
import { applyTexts, withStoredTexts } from "./case-study-texts";
import { fromEditorial, storedPage, type BuilderPage } from "./page-builder";
import { getStore } from "./store";
import { trDeep } from "./translations-en";

// Page d'un projet pour le constructeur et le site : celle enregistrée dans l'admin, sinon la mise en page
// d'origine (textes modifiés dans l'ancien éditeur et traductions compris). null : projet sans page dédiée.
export async function projectPage(id: string): Promise<{ page: BuilderPage; custom: boolean } | null> {
  const store = getStore();
  const [raw, content] = await Promise.all([store.getCaseStudyTexts(id), store.getHomeContent()]);
  const saved = storedPage(raw);
  if (saved) return { page: saved, custom: true };
  const base = caseStudies[id];
  if (!base || !("layout" in base)) return null;
  const fr = withStoredTexts(base, raw);
  const translations = (content ?? {}) as Record<string, string>;
  const blocks = raw && typeof raw === "object" && "blocks" in raw ? (raw as { blocks: unknown }).blocks : undefined;
  const en = applyTexts(trDeep("en", fr), (path) => {
    const match = /^blocks\.(\d+)\./.exec(path);
    if (match && (!Array.isArray(blocks) || blocks[Number(match[1])] !== fr.blocks[Number(match[1])]?.type)) return undefined;
    return translations[`translation:study:${id}:t:${path}`];
  });
  return { page: fromEditorial(fr, en), custom: false };
}
