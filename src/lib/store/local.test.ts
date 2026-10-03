import assert from "node:assert/strict";
import { test } from "node:test";
import { localStore } from "./local";

test("le magasin JSON local refuse de fonctionner en production", async () => {
  const previous = { NODE_ENV: process.env.NODE_ENV, VERCEL_ENV: process.env.VERCEL_ENV };
  try {
    Object.assign(process.env, { NODE_ENV: "production" });
    await assert.rejects(localStore.getCatalog(), /interdit en production/);
    await assert.rejects(localStore.listOrders(), /interdit en production/);
    Object.assign(process.env, { NODE_ENV: "development", VERCEL_ENV: "preview" });
    await assert.rejects(localStore.getPortfolio(), /interdit en production/);
  } finally {
    Object.assign(process.env, { NODE_ENV: previous.NODE_ENV });
    if (previous.VERCEL_ENV === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous.VERCEL_ENV;
  }
});
