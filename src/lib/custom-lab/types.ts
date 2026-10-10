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
};
export type LabDocument = LabContent & {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
export type LabSummary = Pick<LabDocument, "id" | "name" | "description" | "project" | "kind" | "revision" | "updatedAt"> & { size: LabSize; platforms: Platform[]; widgetIds: string[] };
