import type { Platform } from "./platformEvents";
import type { OverlayData } from "./overlay";

export interface FieldDefinition {
  type: string;
  label?: string;
  value?: unknown;
  options?: Record<string, string>;
  min?: number;
  max?: number;
  step?: number;
  steps?: number;
  [key: string]: unknown;
}
export type FieldDefinitions = Record<string, FieldDefinition>;
export type CodeFile = "html" | "css" | "js" | "fields" | "data";
export type LabCode = Record<CodeFile, string>;
export type LabVariant = {
  code: LabCode;
  alerts: Record<string, LabCode>;
  settings: string;
};
export type LabSize = { width: number; height: number };
// Rapport d'une conversion StreamElements → Streamlabs (une entrée par alerte convertie)
export type LabAlertConversion = {
  source: string;
  target: string;
  status: "validated" | "untested" | "manual";
  converted: string[];
  limitations: string[];
  manual: string[];
  // Empreintes du code StreamElements converti et du code Streamlabs produit
  sourceHash: string;
  outputHash: string;
};
export type LabConversion = { at: string; alerts: LabAlertConversion[] };
export type LabContent = {
  name: string;
  description?: string;
  project: string;
  kind: "widget" | "alertbox" | "overlay";
  // overlay : scène composée de calques (les variantes restent présentes mais ne servent pas)
  overlay?: OverlayData;
  // widget / pack d'alertes : taille d'affichage (aperçu, calque d'overlay, réglage de la source)
  size?: LabSize;
  variants: Record<Platform, LabVariant>;
  // Dernière conversion vers Streamlabs (pack d'alertes)
  conversions?: { streamlabs?: LabConversion };
};
export type LabDocument = LabContent & {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
export type LabSummary = Pick<LabDocument, "id" | "name" | "description" | "project" | "kind" | "revision" | "updatedAt"> & { size: LabSize };
