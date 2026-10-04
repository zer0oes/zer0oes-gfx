import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSort, sortOrders } from "./order-sort";
import type { Order } from "./store/types";

const order = (id: string, o: Partial<Order>): Order =>
  ({
    id,
    createdAt: "2026-10-01T10:00:00Z",
    customerEmail: "",
    offerName: "Premier look",
    totalPrice: 49000,
    amountPaid: 49000,
    status: "payee",
    ...o,
  }) as Order;

const list = [
  order("a", { createdAt: "2026-10-01T10:00:00Z", status: "terminee", customerEmail: "zoe@x.fr", totalPrice: 99000, amountPaid: 29700 }),
  order("b", { createdAt: "2026-10-03T10:00:00Z", status: "payee", customerEmail: "Alex@x.fr" }),
  order("c", { createdAt: "2026-10-02T10:00:00Z", status: "en_cours", customerEmail: "", offerName: "Identité signature" }),
  order("d", { createdAt: "2026-10-04T10:00:00Z", status: "payee" }),
];
const ids = (os: Order[]) => os.map((o) => o.id).join("");

test("tri par défaut : date, la plus récente d'abord", () => {
  const { key, dir } = parseSort(undefined, undefined);
  assert.deepEqual([key, dir], ["date", "desc"]);
  assert.equal(ids(sortOrders(list, key, dir)), "dbca");
  assert.equal(ids(sortOrders(list, "date", "asc")), "acbd");
});

test("tri par statut : ordre du cycle de vie, puis date récente", () => {
  assert.deepEqual(parseSort("statut", undefined), { key: "statut", dir: "asc" });
  assert.equal(ids(sortOrders(list, "statut", "asc")), "dbca");
  assert.equal(ids(sortOrders(list, "statut", "desc")), "acdb");
});

test("autres colonnes et valeurs invalides", () => {
  assert.equal(ids(sortOrders(list, "client", "asc")).slice(0, 2), "ba"); // alex < zoe, e-mails vides à la fin
  assert.equal(ids(sortOrders(list, "solde", "desc"))[0], "a");
  assert.deepEqual(parseSort("n'importe", "quoi"), { key: "date", dir: "desc" });
});
