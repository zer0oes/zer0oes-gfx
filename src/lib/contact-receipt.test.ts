import test from "node:test";
import assert from "node:assert/strict";
import { contactReceiptMessage } from "./contact-receipt";
import { customerEmailHtml } from "./customer-email";

test("contact receipt includes the request and omits empty fields", () => {
  const mail = contactReceiptMessage("Alex", { Sujet: "Collaboration", Message: "Bonjour <script>", Vide: "", Absent: "—" }, "fr");
  assert.ok(mail.text.includes("Bonjour Alex"));
  assert.ok(mail.text.includes("Sujet :\nCollaboration"));
  assert.ok(mail.text.includes("Message :\nBonjour <script>"));
  assert.ok(!mail.text.includes("Vide"));
  assert.ok(!mail.text.includes("Absent"));
  const html = customerEmailHtml(mail.subject, mail.text, true);
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("Garde ton lien"));
});

test("English contact receives an English acknowledgement", () => {
  const mail = contactReceiptMessage("Alex", { Message: "Hello" }, "en");
  assert.ok(mail.subject.startsWith("Your"));
  assert.ok(mail.text.includes("48 business hours"));
});
