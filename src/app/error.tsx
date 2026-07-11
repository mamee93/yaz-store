"use client";

import { useEffect } from "react";
import Link from "next/link";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Application route error", {
      message: error.message,
      digest: error.digest
    });
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-oud-ivory px-6 text-center">
      <div className="max-w-md space-y-5">
        <p className="font-display text-5xl text-oud-gold">500</p>
        <h1 className="text-2xl font-semibold text-oud-brown">حدث خطأ غير متوقع</h1>
        <p className="text-sm leading-7 text-oud-muted">
          تعذر تحميل الصفحة الآن. حاول مرة أخرى، وإذا استمرت المشكلة يرجى التواصل مع إدارة المتجر.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-oud bg-oud-brown px-6 text-sm font-semibold text-oud-ivory"
          >
            إعادة المحاولة
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-oud border border-oud-brown/20 bg-oud-pearl px-6 text-sm font-semibold text-oud-brown"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}
