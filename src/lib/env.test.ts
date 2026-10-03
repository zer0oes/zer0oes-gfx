import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { assertNotProduction, devLoginAllowed, isAdminEmail, localStoreAllowed } from "./env";

const env = (vars: Record<string, string>) => ({ NODE_ENV: "development", ...vars }) as NodeJS.ProcessEnv;

test("connexion de dev : refusée en production même si ADMIN_DEV_LOGIN=1", () => {
  assert.equal(devLoginAllowed(env({ ADMIN_DEV_LOGIN: "1" })), true);
  assert.equal(devLoginAllowed(env({ ADMIN_DEV_LOGIN: "1", NODE_ENV: "production" })), false);
  assert.equal(devLoginAllowed(env({ ADMIN_DEV_LOGIN: "1", VERCEL_ENV: "preview" })), false);
  assert.equal(devLoginAllowed(env({ ADMIN_DEV_LOGIN: "1", VERCEL: "1" })), false);
  assert.equal(devLoginAllowed(env({})), false);
});

test("magasin JSON local : refusé en production", () => {
  assert.equal(localStoreAllowed(env({})), true);
  assert.equal(localStoreAllowed(env({ LOCAL_STORE: "0" })), false);
  assert.equal(localStoreAllowed(env({ NODE_ENV: "production" })), false);
  assert.equal(localStoreAllowed(env({ VERCEL_ENV: "production" })), false);
});

test("assertNotProduction lève une erreur en production", () => {
  assert.doesNotThrow(() => assertNotProduction("X", env({})));
  assert.throws(() => assertNotProduction("X", env({ NODE_ENV: "production" })), /interdit en production/);
  assert.throws(() => assertNotProduction("X", env({ VERCEL_ENV: "development" })), /interdit en production/);
});

const saved = process.env.ADMIN_EMAILS;
afterEach(() => {
  process.env.ADMIN_EMAILS = saved;
});

test("e-mails admin : liste ADMIN_EMAILS, insensible à la casse", () => {
  delete process.env.ADMIN_EMAILS;
  assert.equal(isAdminEmail("zer0oes.pro@gmail.com"), true);
  assert.equal(isAdminEmail("autre@exemple.fr"), false);
  process.env.ADMIN_EMAILS = "A@x.fr, b@y.fr";
  assert.equal(isAdminEmail(" a@X.fr "), true);
  assert.equal(isAdminEmail("zer0oes.pro@gmail.com"), false);
  assert.equal(isAdminEmail(""), false);
});
