export const siteConfig = {
  name: "عود ياز",
  nameEn: "Oud Yaz",
  description: "متجر عربي فاخر للعود والبخور والعطور والمسك وأطقم الهدايا.",
  locale: "ar-OM",
  currency: "OMR",
  direction: "rtl",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
} as const;
