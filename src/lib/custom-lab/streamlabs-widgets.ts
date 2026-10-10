// Types de widgets Streamlabs. Sur StreamElements, tout widget est un Custom Widget ; sur Streamlabs, chaque usage
// a son widget natif (Fenêtre de chat, Liste des événements, Objectifs…) dont le HTML / CSS personnalisé a ses propres
// variables. La Fenêtre de chat est simulée dans l'aperçu ; les autres types sont repérés (export, liste) en attendant.
import type { LabCode } from "./types";
import { STREAMLABS_TEMPLATES } from "./streamlabs-templates";

export const STREAMLABS_WIDGETS = [
  { id: "custom", label: "Widget personnalisé" },
  { id: "chatbox", label: "Fenêtre de chat" },
  { id: "eventlist", label: "Liste des événements" },
  { id: "donation-goal", label: "Objectif du don" },
  { id: "follower-goal", label: "Objectif de followers" },
  { id: "subscriber-goal", label: "Objectifs d’abonnés" },
  { id: "bit-goal", label: "Objectif de Bits" },
  { id: "superchat-goal", label: "Objectif de super chat" },
  { id: "member-goal", label: "Objectif de membres YouTube" },
  { id: "tip-jar", label: "Le bocal" },
  { id: "credits", label: "Générique de fin" },
  { id: "donation-ticker", label: "Bandeau de dons" },
  { id: "sponsor-banner", label: "Bannière sponsor" },
  { id: "viewer-count", label: "Nombre de viewers" },
  { id: "stream-labels", label: "Stream Labels" },
  { id: "emote-wall", label: "Mur des émoticônes" },
  { id: "chat-highlight", label: "Mise en évidence du chat" },
  { id: "poll", label: "Sondage" },
  { id: "spin-wheel", label: "Fais tourner la roue" },
  { id: "stream-boss", label: "Boss du stream" },
  { id: "media-share", label: "Partage multimédia" },
] as const;

export type StreamlabsWidget = (typeof STREAMLABS_WIDGETS)[number]["id"];

export const isStreamlabsWidget = (value: unknown): value is StreamlabsWidget => STREAMLABS_WIDGETS.some((w) => w.id === value);
export const streamlabsWidgetLabel = (id: StreamlabsWidget | undefined) => STREAMLABS_WIDGETS.find((w) => w.id === (id ?? "custom"))!.label;

// Code de base de la Fenêtre de chat Streamlabs (« Activer HTML/CSS personnalisé »)
export const CHATBOX_TEMPLATE: LabCode = STREAMLABS_TEMPLATES.chatbox!;

// Réglages natifs de la Fenêtre de chat repris dans le CSS (valeurs de l'aperçu, modifiables par des champs du même nom)
export const CHATBOX_SETTINGS: Record<string, string> = {
  background_color: "transparent",
  text_color: "#FFFFFF",
  font_size: "16px",
  message_hide_delay: "999999s",
};

// Valeurs d'aperçu des réglages natifs repris dans le code (variables entre accolades), par widget Streamlabs
const GOAL_SETTINGS = { bar_thickness: "48", bar_bg_color: "#DDDDDD", bar_text_color: "#FFFFFF", bar_color: "#46E65A" };
export const STREAMLABS_SETTINGS: Partial<Record<StreamlabsWidget, Record<string, string>>> = {
  chatbox: CHATBOX_SETTINGS,
  eventlist: { background: "rgba(23, 23, 32, 0.85)", text_color: "#FFFFFF", font_family: "Open Sans", font_size: "16px", animation_speed: "1000ms", show_animation: "fadeIn", hide_animation: "fadeOut", max_events: "6", rotate_x: "0deg", rotate_y: "0deg", hue: "0deg", brightness: "100%", saturation: "100%" },
  "donation-goal": GOAL_SETTINGS,
  "follower-goal": GOAL_SETTINGS,
  "subscriber-goal": GOAL_SETTINGS,
  "bit-goal": GOAL_SETTINGS,
};
export const isGoalWidget = (target: StreamlabsWidget | undefined) => target === "donation-goal" || target === "follower-goal" || target === "subscriber-goal" || target === "bit-goal";

// Simulation d'un objectif : goalLoad au chargement, goalEvent à chaque évènement simulé (montant ou +1)
export const GOAL_RUNTIME = `
(() => {
  const goal = { title: "Objectif du stream", amount: { current: 25, target: 100 } };
  window.__SL_AFTER__ = (type, detail) => {
    if (type === "onLoad") document.dispatchEvent(new CustomEvent("goalLoad", { detail: JSON.parse(JSON.stringify(goal)) }));
    if (type === "onEventReceived") {
      goal.amount.current = Math.min(goal.amount.target, goal.amount.current + (Number(detail && detail.amount) || 1));
      document.dispatchEvent(new CustomEvent("goalEvent", { detail: JSON.parse(JSON.stringify(goal)) }));
    }
  };
})();
`;

// Simulation de la Fenêtre de chat dans l'aperçu : un message reçu est rendu avec le modèle #chatlist_item et ajouté
// à #log, puis le widget reçoit l'événement au format du chat Streamlabs (onEventReceived).
export const CHATBOX_RUNTIME = `
window.__SL_CHATBOX__ = (type, detail) => {
  if (type !== "onEventReceived" || !detail || (detail.type !== "message" && detail.command !== "PRIVMSG")) return detail;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const from = detail.from || detail.name || "Viewer";
  const body = detail.body ?? detail.message ?? "";
  const color = detail.color || (detail.tags && detail.tags.color) || "#a78bfa";
  const messageId = detail.messageId || String(Date.now()) + Math.random().toString(16).slice(2, 6);
  const template = document.getElementById("chatlist_item");
  const log = document.getElementById("log");
  if (template && log) {
    const html = template.innerHTML.replace(/\\{from\\}/g, esc(from)).replace(/\\{message\\}/g, esc(body)).replace(/\\{color\\}/g, esc(color)).replace(/\\{messageId\\}/g, esc(messageId));
    const box = document.createElement("div");
    box.innerHTML = html.trim();
    while (box.firstChild) log.appendChild(box.firstChild);
    while (log.children.length > 100) log.removeChild(log.firstElementChild);
  }
  return { command: "PRIVMSG", body, from, messageId, owner: false, platform: detail.platform || "twitch_account", tags: { color, "display-name": from, badges: "" } };
};
`;

// README de l'export Streamlabs d'un widget natif (le Widget personnalisé garde le README habituel)
export function streamlabsWidgetReadme(target: StreamlabsWidget): string | null {
  if (target === "custom") return null;
  const label = streamlabsWidgetLabel(target);
  return [
    `Export Streamlabs — ${label}`,
    "",
    `Dans le tableau de bord Streamlabs, ouvrir le widget « ${label} » :`,
    "  1. activer « HTML/CSS personnalisé » (Enable Custom HTML/CSS) ;",
    "  2. coller widget.html, widget.css et widget.js dans les onglets HTML, CSS et JS ;",
    "  3. coller fields.json dans l'onglet Custom Fields s'il contient des champs ;",
    "  4. régler les options natives du widget (plateformes, couleurs, police…) : elles remplacent les variables",
    "     entre accolades du code, par exemple {font_size} ou {text_color}.",
    ...(target === "chatbox" ? ["", "Chaque message utilise le modèle #chatlist_item (variables {from}, {message}, {color}, {messageId}) ajouté dans #log."] : []),
    "",
  ].join("\n");
}

// Code Streamlabs encore égal à un code de base (exemple d'une nouvelle création ou modèle d'un widget natif)
export function isStreamlabsTemplate(code: LabCode, example: LabCode): boolean {
  const same = (a: LabCode, b: LabCode) => a.html === b.html && a.css === b.css && a.js === b.js;
  const empty = !code.html.trim() && !code.css.trim() && !code.js.trim();
  return empty || same(code, example) || Object.values(STREAMLABS_TEMPLATES).some((template) => template && same(code, template));
}
