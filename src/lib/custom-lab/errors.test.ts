import assert from "node:assert/strict";
import { test } from "node:test";
import { LabStorageError } from "./errors";

test("une table absente indique l'initialisation manquante sans erreur brute", () => {
  for (const code of ["PGRST205", "42P01"]) {
    const error = new LabStorageError(code);
    assert.equal(error.reason, "setup");
    assert.match(error.message, /migration/);
    assert.ok(!error.message.includes(code));
  }
});

test("une panne ou un refus d'accès ne sont pas attribués à une migration absente", () => {
  for (const code of [undefined, "42501", "PGRST301"]) {
    const error = new LabStorageError(code);
    assert.equal(error.reason, "unavailable");
    assert.doesNotMatch(error.message, /migration/);
  }
});
