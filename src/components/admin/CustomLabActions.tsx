"use client";
import { useEffect, useRef } from "react";
import { CustomLabDeliver } from "./CustomLabDeliver";
import { MaterialIcon } from "./MaterialIcon";
import type { Platform } from "@/lib/custom-lab/platformEvents";
import type { LabContent } from "@/lib/custom-lab/types";

// onConvert / onReport : conversion d'un pack d'alertes vers Streamlabs (depuis l'onglet StreamElements) et son rapport
export function CustomLabActions({ id, kind, name, platform, dirty, onMedia, onExport, onBackup, onConvert, onReport }: {
  id: string; kind: LabContent["kind"]; name: string; platform: Platform; dirty: boolean;
  onMedia: () => void; onExport?: () => void; onBackup: () => void; onConvert?: () => void; onReport?: () => void;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !menu.current?.contains(event.target) && menu.current) menu.current.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && menu.current?.open) { menu.current.open = false; menu.current.querySelector("summary")?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);
  const run = (action: () => void) => { if (menu.current) menu.current.open = false; action(); };
  const button = "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";
  return <CustomLabDeliver id={id} kind={kind} name={name} platform={platform} dirty={dirty} className="cl-secondary" renderTrigger={(deliver) => <details ref={menu} className="relative">
    <summary className="cl-secondary flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">Actions<MaterialIcon name="expand_more" className="size-4" /></summary>
    <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface p-2 shadow-xl" aria-label="Actions de la création">
      <button type="button" className={button} onClick={() => run(onMedia)}><MaterialIcon name="collections" /><span><strong className="block text-sm font-semibold">Gérer les médias</strong><span className="text-xs text-muted">Images, vidéos et sons de la bibliothèque.</span></span></button>
      <button type="button" className={button} disabled={dirty} onClick={() => run(deliver)}><MaterialIcon name="shopping_bag" /><span><strong className="block text-sm font-semibold">Ajouter à une livraison client</strong><span className="text-xs text-muted">{dirty ? "Disponible après l’enregistrement automatique." : "Déposer cette création dans une commande."}</span></span></button>
      {onConvert && platform === "streamelements" && <button type="button" className={button} onClick={() => run(onConvert)}><MaterialIcon name="sync_alt" /><span><strong className="block text-sm font-semibold">Convertir vers Streamlabs</strong><span className="text-xs text-muted">Génère la version Streamlabs sans modifier celle-ci.</span></span></button>}
      {onReport && <button type="button" className={button} onClick={() => run(onReport)}><MaterialIcon name="assessment" /><span><strong className="block text-sm font-semibold">Rapport de conversion</strong><span className="text-xs text-muted">Converti, limites et adaptations à faire à la main.</span></span></button>}
      {onExport && <button type="button" className={button} onClick={() => run(onExport)}><MaterialIcon name="arrow_downward" /><span><strong className="block text-sm font-semibold">Télécharger pour {platform === "streamlabs" ? "Streamlabs" : "StreamElements"}</strong><span className="text-xs text-muted">Archive ZIP des codes à importer sur la plateforme.</span></span></button>}
      <button type="button" className={button} onClick={() => run(onBackup)}><MaterialIcon name="content_copy" /><span><strong className="block text-sm font-semibold">Télécharger le projet complet</strong><span className="text-xs text-muted">Fichier JSON réimportable dans le Laboratoire.</span></span></button>
    </div>
  </details>} />;
}
