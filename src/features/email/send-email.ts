import "server-only";

type SendEmailInput = {
  to: string | null | undefined;
  subject: string;
  html: string;
  replyTo?: string | null;
};

type ResendPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  reply_to?: string;
};

const resendEndpoint = "https://api.resend.com/emails";

export async function sendEmail({ to, subject, html, replyTo }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!to) {
    return { ok: false, skipped: true, reason: "missing_recipient" };
  }

  if (!apiKey || !from) {
    console.warn("Email skipped: RESEND_API_KEY or EMAIL_FROM is missing.");
    return { ok: false, skipped: true, reason: "missing_email_config" };
  }

  const payload: ResendPayload = {
    from,
    to: [to],
    subject,
    html
  };

  if (replyTo) {
    payload.reply_to = replyTo;
  }

  try {
    const response = await fetch(resendEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send email with Resend", response.status, errorText);
      return { ok: false, skipped: false, reason: "provider_error" };
    }

    return { ok: true, skipped: false };
  } catch (error) {
    console.error("Failed to send email", error);
    return { ok: false, skipped: false, reason: "send_failed" };
  }
}
