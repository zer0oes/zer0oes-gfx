// Liens d'installation des widgets et packs d'alertes, ajoutés aux fichiers définitifs d'un livrable :
// - Streamlabs : lien d'importation natif d'un Widget Theme ;
// - StreamElements : code de partage du service c4ldas SE API (et lien de partage facultatif).
// Servis comme les autres fichiers définitifs : seulement après validation du livrable et paiement intégral.

export type InstallPlatform = "streamlabs" | "streamelements";

// Où obtenir les liens (admin) : partage d'un Widget Theme Streamlabs, code de partage c4ldas pour StreamElements
export const STREAMLABS_THEMES_URL = "https://streamlabs.com/dashboard#/widgetthemes";
export const C4LDAS_URL = "https://seapi.c4ldas.com.br/";

// Page d'installation c4ldas : connexion avec StreamElements, puis saisie du code reçu
export const C4LDAS_INSTALL_URL = "https://seapi.c4ldas.com.br/overlays/install";

export const INSTALL_LABELS: Record<InstallPlatform, { fr: string; en: string }> = {
  streamlabs: { fr: "Installer sur Streamlabs", en: "Install on Streamlabs" },
  streamelements: { fr: "Installer sur StreamElements", en: "Install on StreamElements" },
};

export const isInstallPlatform = (v: unknown): v is InstallPlatform => v === "streamlabs" || v === "streamelements";

// Code de partage c4ldas : lettres, chiffres, tirets et soulignés (espaces retirés)
export function checkInstallCode(raw: string): string | null {
  const code = raw.trim().replace(/\s+/g, "");
  return /^[A-Za-z0-9_-]{4,64}$/.test(code) ? code : null;
}

// Clé enregistrée à l'accès (téléchargé / installé) pour un lien d'installation
export const installAccessKey = (asset: { url?: string; code?: string; install?: InstallPlatform }) => asset.url ?? `${asset.install}:${asset.code}`;
