// Types de widgets Streamlabs. Sur StreamElements, tout widget est un Custom Widget ; sur Streamlabs, chaque usage
// a son widget natif (Fenêtre de chat, Liste des événements, Objectifs…) dont le HTML / CSS personnalisé a ses propres
// variables. La Fenêtre de chat est simulée dans l'aperçu ; les autres types sont repérés (export, liste) en attendant.
import type { LabCode } from "./types";

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
export const CHATBOX_TEMPLATE: LabCode = {
  html: `<!-- item will be appended to this layout -->
<div id="log" class="sl__chat__layout">

</div>

<!-- chat item -->
<script type="text/template" id="chatlist_item">
    <div data-from="{from}" data-id="{messageId}">
        <span class="meta" style="color: {color}">
            <span class="badges"></span>
            <span class="name">{from}</span>
        </span>

        <span class="message">{message}</span>
    </div>
</script>
`,
  css: `@import url(https://fonts.googleapis.com/css?family=Roboto:700);

* {
    box-sizing: border-box;
}

html, body {
    height: 100%;
    overflow: hidden;
}

body {
    text-shadow: 0 0 1px #000, 0 0 2px #000;
    background: {background_color};
    font-family: 'Roboto';
    font-weight: 700;
    font-size: {font_size};
    line-height: 1.5em;
    color: {text_color};
}

#log>div {
    animation: fadeInRight .3s ease forwards, fadeOut 0.5s ease {message_hide_delay} forwards;
    -webkit-animation: fadeInRight .3s ease forwards, fadeOut 0.5s ease {message_hide_delay} forwards;
}

.colon {
    display: none;
}

#log {
    display: table;
    position: absolute;
    bottom: 0;
    left: 0;
    padding: 0 10px 10px;
    width: 100%;
    table-layout: fixed;
}

#log>div {
    display: table-row;
}

#log>div.deleted {
    visibility: hidden;
}

#log .emote {
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    padding: 0.4em 0.2em;
    position: relative;
}

#log .emote img {
    display: inline-block;
    height: 1em;
    opacity: 0;
}

#log .message,#log .meta {
    vertical-align: top;
    display: table-cell;
    padding-bottom: 0.1em;
}

#log .meta {
    width: 35%;
    text-align: right;
    padding-right: 0.5em;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}

#log .message {
    word-wrap: break-word;
    width: 65%;
}

.badge {
    display: inline-block;
    margin-right: 0.2em;
    position: relative;
    height: 1em;
    vertical-align: middle;
    top: -0.1em;
}

.name {
    margin-left: 0.2em;
}
`,
  js: `// Please use event listeners to run functions.
document.addEventListener('onLoad', function (obj) {
  // obj will be empty for chat widget
  // this will fire only once when the widget loads
});

document.addEventListener('onEventReceived', function (obj) {
  // obj will contain information about the event
});
`,
  fields: "{}",
  data: "{}",
};

// Réglages natifs de la Fenêtre de chat repris dans le CSS (valeurs de l'aperçu, modifiables par des champs du même nom)
export const CHATBOX_SETTINGS: Record<string, string> = {
  background_color: "transparent",
  text_color: "#FFFFFF",
  font_size: "16px",
  message_hide_delay: "999999s",
};

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
