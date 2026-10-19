// Rafraîchissement automatique du site après un enregistrement dans l'admin :
// l'admin prévient les onglets du site ouverts dans le même navigateur, qui relisent la page sans la recharger.
const CHANNEL = "zer0oes-site-refresh";

export function notifySiteChanged() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage("changed");
  channel.close();
}

export function onSiteChanged(callback: () => void) {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = () => callback();
  return () => channel.close();
}
