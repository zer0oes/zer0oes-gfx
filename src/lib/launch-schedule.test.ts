import assert from "node:assert/strict";
import { test } from "node:test";
import { parseParisSchedule, parisScheduleParts } from "./launch-schedule";
test("programmation en heure de Paris : hiver, été, changement d'heure et entrées invalides", () => {
  assert.equal(parseParisSchedule("2026-10-20", "09:30"), "2026-10-20T07:30:00.000Z");
  assert.equal(parseParisSchedule("2026-11-01", "09:30"), "2026-11-01T08:30:00.000Z");
  assert.deepEqual(parisScheduleParts("2026-10-20T07:30:00Z"), { day: "2026-10-20", time: "09:30" });
  for (const [day, time] of [["2026-03-29", "02:30"], ["2026-10-25", "02:30"], ["2026-02-30", "10:00"], ["2026-10-20", "25:00"], ["", "09:00"]]) {
    assert.throws(() => parseParisSchedule(day, time));
  }
});
