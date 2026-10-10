// Règles de conversion StreamElements → Streamlabs, une par type d'alerte de l'AlertBox StreamElements.
// Une alerte n'est « validée » qu'après un test réel sur Streamlabs (Follow, octobre 2026) : les autres
// sont converties avec les mêmes règles mais signalées « non testées ».
import type { AlertboxAlertType } from "../alertbox";

export type ConversionStatus = "validated" | "untested" | "manual";

// Variable StreamElements ({{…}}) → variable Streamlabs ({…}), ou null si Streamlabs n'a pas d'équivalent
type VariableMap = Record<string, string | null>;

export type AlertRule = {
  // Alerte Streamlabs qui reçoit le code
  target: AlertboxAlertType;
  // Listener StreamElements reconstitué pour un éventuel onEventReceived du code d'origine
  listener: string;
  validated: boolean;
  variables: VariableMap;
  // Variables placées dans le bloc caché #alertData (toujours lisibles par readVar)
  data: string[];
  // Différences de sens à signaler même quand la variable est convertie
  notes?: string[];
};

const message = { message: "message", userMessage: "message", messageRaw: "message" };

export const ALERT_RULES: Partial<Record<AlertboxAlertType, AlertRule>> = {
  follow: { target: "follow", listener: "follower-latest", validated: true, variables: { name: "name" }, data: ["name"] },
  sub: { target: "sub", listener: "subscriber-latest", validated: false, variables: { name: "name", amount: "months", count: "months", months: "months", ...message }, data: ["name", "months", "message"] },
  resub: { target: "resub", listener: "subscriber-latest", validated: false, variables: { name: "name", amount: "months", count: "months", months: "months", ...message }, data: ["name", "months", "message"] },
  gift: {
    target: "giftsub", listener: "subscriber-latest", validated: false,
    variables: { name: "name", sender: "name", amount: "count", count: "count" }, data: ["name", "count"],
    notes: ["Sur Streamlabs, {name} désigne la personne qui offre (sur StreamElements, {{name}} est le destinataire et {{sender}} celle qui offre)."],
  },
  community: {
    target: "giftsub", listener: "subscriber-latest", validated: false,
    variables: { name: "name", sender: "name", amount: "count", count: "count" }, data: ["name", "count"],
    notes: ["Streamlabs regroupe subs offerts et community gifts dans « Gift Subs » : un seul code pour les deux."],
  },
  cheer: { target: "bits", listener: "cheer-latest", validated: false, variables: { name: "name", amount: "amount", count: "amount", ...message }, data: ["name", "amount", "message"] },
  tip: {
    target: "tip", listener: "tip-latest", validated: false,
    variables: { name: "name", amount: "amount", currency: null, ...message }, data: ["name", "amount", "message"],
    notes: ["Sur Streamlabs, {amount} contient déjà la devise (ex. « 5,00 € »)."],
  },
  raid: { target: "raid", listener: "raid-latest", validated: false, variables: { name: "name", amount: "count", count: "count" }, data: ["name", "count"] },
  purchase: { target: "merch", listener: "purchase-latest", validated: false, variables: { name: "name", items: "product", ...message }, data: ["name", "product", "message"] },
  charity: {
    target: "charity", listener: "charityCampaignDonation-latest", validated: false,
    variables: { name: "name", amount: "amount", currency: null, ...message }, data: ["name", "amount", "message"],
    notes: ["Sur Streamlabs, {amount} contient déjà la devise."],
  },
};

// Variables StreamElements sans équivalent dans l'Alert Box Streamlabs, pour tous les types
export const UNSUPPORTED_VARIABLES = ["tier", "announcement", "messageTemplate", "image", "video", "videoVolume", "audio", "audioVolume"];

// Types de champs StreamElements que Streamlabs ne connaît pas
export const UNSUPPORTED_FIELD_TYPES: Record<string, string> = {
  checkbox: "case à cocher",
  number: "nombre",
  button: "bouton",
  hidden: "champ caché",
};
