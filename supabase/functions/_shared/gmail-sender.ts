// Shared helper: send transactional emails from hello@sitdownvienna.app
// via the Google Mail connector gateway (gmail.send scope).
//
// Replaces previous Resend-based sends. Uses the connection "SitDown Vienna"
// already linked to this project (GOOGLE_MAIL_API_KEY) and LOVABLE_API_KEY.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
export const DEFAULT_FROM = "Sitdown Vienna <hello@sitdownvienna.app>";

export interface SendGmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface SendGmailResult {
  ok: boolean;
  status: number;
  messageId?: string;
  error?: string;
}

function toAddressList(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value.join(", ") : value;
}

function encodeUtf8Header(value: string): string {
  // RFC 2047 encoded-word for non-ASCII subjects/names
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const b64 = btoa(unescape(encodeURIComponent(value)));
  return `=?UTF-8?B?${b64}?=`;
}

function base64UrlEncode(input: string): string {
  // Encode UTF-8 string to base64url for Gmail raw payload
  const utf8 = unescape(encodeURIComponent(input));
  const b64 = btoa(utf8);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildRfc2822Message(opts: SendGmailOptions): string {
  const boundary = `=_sitdown_${crypto.randomUUID().replace(/-/g, "")}`;
  const from = (opts.from || DEFAULT_FROM).replace(/[\r\n]+/g, " ").trim();
  const to = toAddressList(opts.to)!.replace(/[\r\n]+/g, " ").trim();
  const cc = toAddressList(opts.cc);
  const bcc = toAddressList(opts.bcc);
  const subject = encodeUtf8Header(opts.subject.replace(/[\r\n]+/g, " ").trim());
  const text = (opts.text ?? opts.html.replace(/<[^>]+>/g, "").replace(/\s+\n/g, "\n").trim()) || " ";

  const headers: string[] = [
    `From: ${from}`,
    `To: ${to}`,
  ];
  if (cc) headers.push(`Cc: ${cc}`);
  if (bcc) headers.push(`Bcc: ${bcc}`);
  if (opts.replyTo) headers.push(`Reply-To: ${opts.replyTo.replace(/[\r\n]+/g, " ").trim()}`);
  headers.push(`Subject: ${subject}`);
  headers.push("MIME-Version: 1.0");
  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

  const body = [
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    opts.html,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return headers.join("\r\n") + "\r\n" + body;
}

/**
 * Send an email via Gmail (hello@sitdownvienna.app).
 * Returns { ok, status, messageId?, error? } — never throws.
 */
export async function sendGmail(opts: SendGmailOptions): Promise<SendGmailResult> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const gmailKey = Deno.env.get("GOOGLE_MAIL_API_KEY");
  if (!lovableKey || !gmailKey) {
    return { ok: false, status: 500, error: "Missing LOVABLE_API_KEY or GOOGLE_MAIL_API_KEY" };
  }

  if (!opts.to || (Array.isArray(opts.to) && opts.to.length === 0)) {
    return { ok: false, status: 400, error: "Missing 'to'" };
  }

  const raw = base64UrlEncode(buildRfc2822Message(opts));

  try {
    const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gmailKey,
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[sendGmail] HTTP ${res.status}: ${errText.slice(0, 500)}`);
      return { ok: false, status: res.status, error: errText.slice(0, 500) };
    }

    const data = await res.json().catch(() => ({} as { id?: string }));
    return { ok: true, status: 200, messageId: (data as { id?: string }).id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[sendGmail] network error: ${msg}`);
    return { ok: false, status: 500, error: msg };
  }
}
