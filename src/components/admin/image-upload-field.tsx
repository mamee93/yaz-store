"use client";

import { ImageIcon, Upload } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { cn } from "@/utils/cn";

type ImageUploadFieldProps = {
  name: string;
  label: string;
  currentImageUrl?: string | null;
  required?: boolean;
  multiple?: boolean;
  accept?: string;
  helpText?: string;
  previewAlt?: string;
  previewClassName?: string;
};

export function ImageUploadField({
  name,
  label,
  currentImageUrl,
  required = false,
  multiple = false,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml",
  helpText,
  previewAlt,
  previewClassName
}: ImageUploadFieldProps) {
  const inputId = useId();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    currentImageUrl ? [currentImageUrl] : []
  );

  useEffect(() => {
    if (selectedFiles.length === 0) {
      setPreviewUrls(currentImageUrl ? [currentImageUrl] : []);
      return;
    }

    const objectUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(objectUrls);

    return () => {
      for (const url of objectUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [currentImageUrl, selectedFiles]);

  const fileSummary =
    selectedFiles.length > 0
      ? selectedFiles.map((file) => file.name).join(", ")
      : currentImageUrl
        ? "الصورة الحالية محفوظة"
        : "لم يتم اختيار صورة";

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-oud-brown">{label}</p>
        <input
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          required={required}
          multiple={multiple}
          className="sr-only"
          onChange={(event) => {
            setSelectedFiles(Array.from(event.target.files ?? []));
          }}
        />
        <label
          htmlFor={inputId}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-oud border border-oud-brown/15 bg-white px-4 py-2 text-sm font-semibold text-oud-brown transition hover:bg-oud-beige/35 sm:w-auto"
        >
          <Upload className="size-4" aria-hidden="true" />
          اختيار صورة
        </label>
        <p className="truncate text-xs text-oud-muted" dir="auto">
          {fileSummary}
        </p>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-oud border border-oud-brown/10 bg-oud-beige/25",
          previewClassName
        )}
      >
        {previewUrls.length > 0 ? (
          <div className={multiple ? "grid gap-2 p-2 sm:grid-cols-2" : ""}>
            {previewUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="min-h-36 bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${url}")` }}
                role="img"
                aria-label={previewAlt ?? label}
              />
            ))}
          </div>
        ) : (
          <div className="grid min-h-36 place-items-center gap-2 px-4 py-6 text-center text-sm text-oud-muted">
            <ImageIcon className="size-7" aria-hidden="true" />
            <span>اختر صورة للمعاينة</span>
          </div>
        )}
      </div>

      {helpText ? <p className="text-xs leading-5 text-oud-muted">{helpText}</p> : null}
    </div>
  );
}
