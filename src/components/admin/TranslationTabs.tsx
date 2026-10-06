"use client";

import { createContext, useContext, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { tr } from "@/lib/translations-en";

const LanguageContext = createContext<"fr" | "en">("fr");
const ContentContext = createContext<Record<string, string>>({});

export function TranslationTabs({ stored, children }: { stored: Record<string, string>; children: ReactNode }) {
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  const id = useId();
  return (
    <ContentContext.Provider value={stored}>
      <LanguageContext.Provider value={language}>
        <div role="tablist" aria-label="Langue des textes" className="my-6 flex gap-6 border-b border-border">
          {(["fr", "en"] as const).map((locale) => (
            <button key={locale} id={`${id}-${locale}`} type="button" role="tab" aria-selected={language === locale}
              aria-controls={`${id}-panel`} tabIndex={language === locale ? 0 : -1} onClick={() => setLanguage(locale)}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const next = event.key === "Home" ? "fr" : event.key === "End" ? "en" : language === "fr" ? "en" : "fr";
                setLanguage(next);
                document.getElementById(`${id}-${next}`)?.focus();
              }}
              className={`-mb-px border-b-2 px-1 py-3 text-sm transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-accent ${language === locale ? "is-active border-accent font-medium text-accent" : "border-transparent text-muted hover:border-muted/50 hover:text-foreground"}`}>
              {locale === "fr" ? "Français" : "English"}
            </button>
          ))}
        </div>
        <p className="mb-4 text-xs text-muted">Les deux langues sont enregistrées ensemble. Les prix, médias et réglages sont communs. Un texte anglais vide reprend la traduction d’origine, ou le français.</p>
        <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${language}`}>{children}</div>
      </LanguageContext.Provider>
    </ContentContext.Provider>
  );
}

type Props = Pick<InputHTMLAttributes<HTMLInputElement>, "className" | "required" | "maxLength" | "placeholder" | "aria-label"> & {
  name: string;
  defaultValue?: string;
  translationKey: string;
  englishDefault?: string;
  rows?: number;
  multiline?: boolean;
};

export function TranslationInput({ translationKey, englishDefault, multiline, rows, defaultValue = "", ...props }: Props) {
  const language = useContext(LanguageContext);
  const stored = useContext(ContentContext);
  const fallback = englishDefault ?? defaultValue.split("\n").map((line) => tr("en", line)).join("\n");
  const english = stored[translationKey] ?? fallback;
  return (
    <>
      <span hidden={language !== "fr"}>
        {multiline ? <textarea {...props} required={language === "fr" && props.required} defaultValue={defaultValue} rows={rows} lang="fr" />
          : <input {...props} required={language === "fr" && props.required} defaultValue={defaultValue} lang="fr" />}
      </span>
      <span hidden={language !== "en"}>
        {multiline ? <textarea {...props} name={`en:${props.name}`} required={false} defaultValue={english} rows={rows} lang="en" />
          : <input {...props} name={`en:${props.name}`} required={false} defaultValue={english} lang="en" />}
      </span>
    </>
  );
}
