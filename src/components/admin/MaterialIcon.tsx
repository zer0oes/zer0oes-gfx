export type MaterialIconName = "dashboard" | "assessment" | "shopping_bag" | "tune" | "home" | "collections" | "open_in_new" | "logout" | "chevron_left" | "chevron_right" | "person" | "gavel" | "science";

// SVG Material Icons officiels, servis localement et teintés avec la couleur du lien.
export function MaterialIcon({ name }: { name: MaterialIconName }) {
  const mask = `url(/icons/material/${name}.svg)`;
  return <span aria-hidden="true" className="inline-block size-5 shrink-0 bg-current"
    style={{ maskImage: mask, WebkitMaskImage: mask, maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center" }} />;
}
