import { generateKeyPairSync, createVerify } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildMimeMessage, parseServiceAccountKey, resetGmailTokenCache } from "@/lib/gmail";
import { resolveMailTransport, sendContactMail } from "@/lib/mailer";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const keyJson = JSON.stringify({
  client_email: "fixture@fixture.iam.gserviceaccount.com",
  private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetGmailTokenCache();
});

describe("mail transport", () => {
  it("prefers Gmail from contact@ when the key is present, as JSON or base64", () => {
    for (const value of [keyJson, Buffer.from(keyJson).toString("base64")]) {
      const transport = resolveMailTransport({
        GOOGLE_SERVICE_ACCOUNT_KEY: value,
        AGENTMAIL_API_KEY: "also-set",
      });
      expect(transport).toMatchObject({ kind: "gmail", sender: "contact@backflowtestpros.com" });
    }
  });

  it("falls back to AgentMail, and to nothing, rather than guessing", () => {
    expect(resolveMailTransport({ AGENTMAIL_API_KEY: "k" })).toMatchObject({ kind: "agentmail" });
    expect(resolveMailTransport({ GOOGLE_SERVICE_ACCOUNT_KEY: "not a key" })).toBeNull();
    expect(parseServiceAccountKey('{"client_email":"x"}')).toBeNull();
  });
});

describe("MIME message", () => {
  it("cannot be given extra headers by a submitted name or subject", () => {
    const mime = buildMimeMessage({
      sender: "contact@backflowtestpros.com",
      fromName: "Backflow Test Pros",
      to: "lead@example.com\r\nBcc: attacker@example.com",
      subject: "Hello\r\nBcc: attacker@example.com",
      text: "body",
    });
    const headerBlock = mime.split("\r\n\r\n")[0];
    expect(headerBlock.split("\r\n").filter((line) => /^bcc:/i.test(line))).toEqual([]);
  });

  it("carries the customer's uploaded notice as an attachment", () => {
    const mime = buildMimeMessage({
      sender: "contact@backflowtestpros.com",
      fromName: "Backflow Test Pros",
      to: ["office@example.com"],
      subject: "New contact form lead: José",
      text: "plain",
      html: "<p>plain</p>",
      attachments: [{ filename: "notice.pdf", content_type: "application/pdf", content: "QUJD" }],
    });
    expect(mime).toContain("multipart/mixed");
    expect(mime).toContain('filename="notice.pdf"');
    expect(mime).toContain("=?UTF-8?B?");
  });
});

describe("sending", () => {
  it("signs as the service account, acts as contact@, and posts the message to Gmail", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), init });
      return String(url).includes("oauth2")
        ? new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }))
        : new Response(JSON.stringify({ id: "m1", threadId: "t1" }));
    });

    const transport = resolveMailTransport({ GOOGLE_SERVICE_ACCOUNT_KEY: keyJson })!;
    const mail = { fromName: "Backflow Test Pros", to: "lead@example.com", subject: "s", text: "t" };
    expect(await sendContactMail(transport, mail)).toEqual({ message_id: "m1", thread_id: "t1" });
    await sendContactMail(transport, mail);

    // One token for two sends: the second reuses the cached token.
    expect(calls.map((c) => new URL(c.url).hostname)).toEqual([
      "oauth2.googleapis.com", "gmail.googleapis.com", "gmail.googleapis.com",
    ]);

    const assertion = (calls[0].init.body as URLSearchParams).get("assertion")!;
    const [header, claims, signature] = assertion.split(".");
    expect(JSON.parse(Buffer.from(claims, "base64url").toString())).toMatchObject({
      sub: "contact@backflowtestpros.com",
      scope: "https://www.googleapis.com/auth/gmail.modify",
    });
    expect(
      createVerify("RSA-SHA256").update(`${header}.${claims}`).verify(publicKey, signature, "base64url"),
    ).toBe(true);
    expect(String(calls[1].init.body)).toContain('From: "Backflow Test Pros" <contact@backflowtestpros.com>');
  });

  it("reports Google's refusal instead of swallowing it", async () => {
    vi.stubGlobal("fetch", async () => new Response('{"error":"unauthorized_client"}', { status: 401 }));
    const transport = resolveMailTransport({ GOOGLE_SERVICE_ACCOUNT_KEY: keyJson })!;
    await expect(
      sendContactMail(transport, { fromName: "x", to: "a@b.co", subject: "s", text: "t" }),
    ).rejects.toThrow(/unauthorized_client/);
  });
});
