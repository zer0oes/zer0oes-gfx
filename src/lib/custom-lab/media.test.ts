import assert from "node:assert/strict";
import { test } from "node:test";
import { LAB_MEDIA_MAX_BYTES, labMediaCheck, labMediaPath } from "./media";

test("médias du Laboratoire : formats, poids et chemin de stockage", () => {
  assert.equal(labMediaCheck("image/png", 1000), null);
  assert.equal(labMediaCheck("audio/mpeg", 1000), null);
  assert.match(labMediaCheck("application/pdf", 1000) ?? "", /Format non accepté/);
  assert.match(labMediaCheck("video/webm", LAB_MEDIA_MAX_BYTES + 1) ?? "", /trop lourd/);
  const path = labMediaPath("Mon Son Énorme!.MP3", "audio/mpeg");
  assert.match(path, /^laboratoire\/[0-9a-f]{8}-mon-son-enorme\.mp3$/);
});
