export function getPublicAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configuredUrl || "http://localhost:3000").replace(/\/+$/, "");
}

export function getOrderTrackingUrl(orderNumber: string) {
  const params = new URLSearchParams({ order: orderNumber });
  return `${getPublicAppUrl()}/track-order?${params.toString()}`;
}
