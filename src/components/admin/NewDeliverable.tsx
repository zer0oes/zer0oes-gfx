"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeliveryUpload } from "./DeliveryUpload";
import { Drawer, DrawerButton } from "./Drawer";
import { flushUploads, hasPendingUploads } from "./pending-uploads";

const DRAWER = "livrable-nouveau";
const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

// Nouveau livrable dans un panneau latéral : un nom, puis un lien d'import ou un fichier, envoyés à l'enregistrement
export function NewDeliverable({ orderId, supabaseUrl, supabaseKey, linkAction }: {
  orderId: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  linkAction: (form: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"link" | "file">("file");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setError("");
    if (!name.trim()) return setError("Donne un nom au livrable.");
    if (kind === "link") {
      if (!/^https:\/\//.test(url.trim())) return setError("Le lien doit commencer par https://.");
      setBusy(true);
      const form = new FormData();
      form.set("orderId", orderId);
      form.set("label", name.trim());
      form.set("url", url.trim());
      await linkAction(form); // redirige vers la commande
      return;
    }
    if (!hasPendingUploads(DRAWER)) return setError("Choisis ou dépose un fichier.");
    setBusy(true);
    const failed = await flushUploads(DRAWER);
    setBusy(false);
    if (failed.length) return setError("Envoi impossible : voir le message sous la zone du fichier.");
    (document.getElementById(DRAWER) as HTMLDialogElement | null)?.close();
    setName("");
    router.refresh();
  };

  return (
    <>
      <div className="mt-6">
        <DrawerButton drawer={DRAWER} className="rounded-full border border-accent/50 px-4 py-1.5 text-sm text-accent hover:bg-accent/10">
          + Ajouter un livrable
        </DrawerButton>
      </div>
      <Drawer
        id={DRAWER}
        kicker="Livrable"
        title="Nouveau livrable"
        footer={
          <>
            {error ? <span role="alert" className="text-xs text-red-300">{error}</span> : <span />}
            <button type="button" onClick={save} disabled={busy} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-60">
              {busy ? "Envoi…" : "Enregistrer"}
            </button>
          </>
        }
      >
        <label className="block text-sm font-medium">
          Nom affiché au client
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex. Overlay Starting — StreamElements" className={`${input} mt-1 font-normal`} />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Contenu du livrable">
          {(["file", "link"] as const).map((type) => (
            <button key={type} type="button" aria-pressed={kind === type} onClick={() => setKind(type)} className={`rounded-lg border px-4 py-2 text-sm font-medium ${kind === type ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-accent"}`}>
              {type === "link" ? "Lien d’import" : "Fichier"}
            </button>
          ))}
        </div>
        {kind === "link" ? (
          <label className="block text-sm font-medium">
            Adresse du lien d’import
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://streamelements.com/…" className={`${input} mt-1 font-normal`} />
          </label>
        ) : (
          <DeliveryUpload orderId={orderId} supabaseUrl={supabaseUrl} supabaseKey={supabaseKey} saveScope={DRAWER} fixedLabel={name.trim()} />
        )}
      </Drawer>
    </>
  );
}
