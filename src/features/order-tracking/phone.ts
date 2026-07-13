export function normalizeTrackingPhone(value?: string | null) {
  const digits = value?.replace(/[^\d]/g, "") ?? "";

  if (!digits) {
    return "";
  }

  const withoutCountryCode = digits.startsWith("968") && digits.length > 8 ? digits.slice(3) : digits;
  return withoutCountryCode.length > 8 ? withoutCountryCode.slice(-8) : withoutCountryCode;
}

export function phonesMatch(input?: string | null, stored?: string | null) {
  const normalizedInput = normalizeTrackingPhone(input);
  const normalizedStored = normalizeTrackingPhone(stored);

  return Boolean(normalizedInput && normalizedStored && normalizedInput === normalizedStored);
}

export function maskPhone(value?: string | null) {
  const normalized = normalizeTrackingPhone(value);

  if (!normalized) {
    return "-";
  }

  return `****${normalized.slice(-4)}`;
}

export function maskCustomerName(value?: string | null) {
  const name = value?.trim();

  if (!name) {
    return "عميل عود ياز";
  }

  if (name.length <= 2) {
    return `${name[0] ?? ""}***`;
  }

  return `${name[0]}***${name[name.length - 1]}`;
}
