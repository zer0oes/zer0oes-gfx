import { BriefLogoPreview } from "./BriefLogoPreview";
const longFields = new Set(["Univers / ambiance", "Références", "Éléments à inclure", "Remarques", "Projet", "Message", "Proposition acceptée", "Inspirations"]);
const isLongField = (key: string) => longFields.has(key) || key.startsWith("Création ");

function safeLink(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export function BriefSummary({ brief, orderId, logoPreview }: { brief: Record<string, string>; orderId: string; logoPreview?: string }) {
  const entries = Object.entries(brief).filter(([, value]) => value);
  return <div className="mt-5 space-y-6">
    {safeLink(brief["Logo existant"] ?? "") && <BriefLogoPreview key={logoPreview ?? brief["Logo existant"]} orderId={orderId} original={safeLink(brief["Logo existant"])!} stored={logoPreview} />}
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
      {entries.filter(([key]) => !isLongField(key) && key !== "Logo existant").map(([key, value]) => {
        const link = ["Chaîne", "Logo existant"].includes(key) ? safeLink(value) : null;
        return <div key={key} className="min-w-0"><dt className="text-xs font-medium text-muted">{key}</dt><dd className="mt-1 break-words text-sm">{link ? <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">{key === "Chaîne" ? "Ouvrir la chaîne ↗" : "Voir le logo ↗"}</a> : value}</dd></div>;
      })}
    </dl>
    {entries.filter(([key]) => isLongField(key)).map(([key, value]) => <section key={key} className="-mx-5 border-t border-border px-5 pt-5 sm:-mx-6 sm:px-6"><h3 className="text-sm font-semibold">{key}</h3><p className="mt-3 max-w-5xl whitespace-pre-wrap break-words text-sm leading-7 text-foreground/85">{value}</p></section>)}
  </div>;
}
