"use client";

import { useState } from "react";

type BannerImageFieldProps = {
  currentImageUrl?: string | null;
  label?: string;
  required?: boolean;
};

export function BannerImageField({
  currentImageUrl,
  label = "صورة البنر",
  required = false
}: BannerImageFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl ?? null);

  return (
    <div className="space-y-3">
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-oud-brown">{label}</span>
        <input
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          required={required}
          className="block w-full min-w-0 rounded-oud border border-dashed border-oud-brown/20 bg-oud-beige/25 px-3 py-3 text-sm text-oud-muted file:ms-0 file:me-3 file:rounded-md file:border-0 file:bg-oud-brown file:px-4 file:py-2 file:text-sm file:font-semibold file:text-oud-ivory"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (!file) {
              setPreviewUrl(currentImageUrl ?? null);
              return;
            }

            setPreviewUrl(URL.createObjectURL(file));
          }}
        />
      </label>

      <div className="relative min-h-36 overflow-hidden rounded-oud border border-oud-brown/10 bg-oud-beige/25">
        {previewUrl ? (
          <div
            className="min-h-36 bg-cover bg-center"
            style={{ backgroundImage: `url("${previewUrl}")` }}
            role="img"
            aria-label="معاينة صورة البنر"
          />
        ) : (
          <div className="grid min-h-36 place-items-center px-4 text-center text-sm text-oud-muted">
            اختيار صورة / رفع صورة
          </div>
        )}
      </div>

      <p className="text-xs leading-5 text-oud-muted">
        الصيغ المسموحة: PNG, JPG, WEBP, SVG. الحد الأقصى 5MB.
      </p>
    </div>
  );
}
