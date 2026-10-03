// Adresse publique du site (NEXT_PUBLIC_SITE_URL, sinon le domaine définitif), sans « / » final.
export const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.zer0oes-gfx.com").replace(/\/$/, "");
