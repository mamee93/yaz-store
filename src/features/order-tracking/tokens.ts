import { createHmac, timingSafeEqual } from "node:crypto";

type TrackingTokenPayload = {
  orderId: string;
  exp: number;
};

const tokenTtlMs = 15 * 60 * 1000;

export function createTrackingToken(orderId: string) {
  const payload: TrackingTokenPayload = {
    orderId,
    exp: Date.now() + tokenTtlMs
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyTrackingToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature || !safeEquals(signature, sign(encodedPayload))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as TrackingTokenPayload;

    if (!payload.orderId || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function sign(value: string) {
  return createHmac("sha256", getTrackingSecret()).update(value).digest("base64url");
}

function safeEquals(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getTrackingSecret() {
  return (
    process.env.ORDER_TRACKING_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "oud-yaz-order-tracking"
  );
}
