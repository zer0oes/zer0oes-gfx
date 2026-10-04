import assert from "node:assert/strict";
import { test } from "node:test";
import { mediaUrl } from "./media";

test("médias du site servis depuis le bucket S3 quand l'adresse est définie", () => {
  const base = "https://zer0oes-gfx.s3.eu-west-3.amazonaws.com";
  assert.equal(mediaUrl("/portfolio/zer0oes-chat-169.mp4", base), `${base}/portfolio/zer0oes-chat-169.mp4`);
  assert.equal(mediaUrl("/a-propos/aurore.webp", base), `${base}/a-propos/aurore.webp`);
  // Autres chemins et adresses complètes inchangés ; sans adresse S3, rien ne change
  assert.equal(mediaUrl("/logo-zeroes-gfx.png", base), "/logo-zeroes-gfx.png");
  assert.equal(mediaUrl("https://exemple.supabase.co/x.webp", base), "https://exemple.supabase.co/x.webp");
  assert.equal(mediaUrl("/portfolio/x.webp", ""), "/portfolio/x.webp");
  assert.equal(mediaUrl(undefined, base), undefined);
});
