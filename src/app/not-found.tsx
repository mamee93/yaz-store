import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-oud-ivory px-6 text-center">
      <div className="max-w-md space-y-5">
        <p className="font-display text-5xl text-oud-gold">404</p>
        <h1 className="text-2xl font-semibold text-oud-brown">الصفحة غير موجودة</h1>
        <p className="text-sm leading-7 text-oud-muted">
          الرابط الذي تحاول الوصول إليه غير متاح حالياً.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-oud bg-oud-brown px-6 text-sm font-semibold text-oud-ivory"
        >
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
