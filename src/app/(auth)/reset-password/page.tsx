"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

type ResetStatus = "checking" | "ready" | "invalid" | "success";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<ResetStatus>("checking");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function prepareRecoverySession() {
      const supabase = createClient();
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const code = searchParams.get("code");
      const hashError = hashParams.get("error_description") || hashParams.get("error");
      const isRecoveryLink = Boolean(
        code || hashParams.get("access_token") || hashParams.get("refresh_token")
      );

      if (hashError) {
        setStatus("invalid");
        setError("رابط الاستعادة غير صالح أو انتهت صلاحيته.");
        return;
      }

      if (!isRecoveryLink) {
        setStatus("invalid");
        setError("رابط الاستعادة غير صالح أو انتهت صلاحيته.");
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("Password recovery code exchange failed:", exchangeError.message);

          if (isMounted) {
            setStatus("invalid");
            setError("رابط الاستعادة غير صالح أو انتهت صلاحيته.");
          }

          return;
        }

        window.history.replaceState(null, "", "/reset-password");
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (!session) {
        setStatus("invalid");
        setError("رابط الاستعادة غير صالح أو انتهت صلاحيته.");
        return;
      }

      setStatus("ready");
    }

    prepareRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمة المرور وتأكيدها غير متطابقتين.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password
    });

    if (updateError) {
      console.error("Password update failed:", updateError.message);
      setError("تعذر حفظ كلمة المرور الجديدة. تأكد من صلاحية الرابط وحاول مرة أخرى.");
      setIsSubmitting(false);
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    setStatus("success");
    window.location.assign(
      `/login?message=${encodeURIComponent(
        "تم تغيير كلمة المرور بنجاح. سجّل الدخول بكلمة المرور الجديدة."
      )}`
    );
  }

  return (
    <section className="grid min-h-screen place-items-center bg-oud-ivory px-4 py-10" dir="rtl">
      <Card className="w-full max-w-md p-6 md:p-8">
        <div className="mb-7 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-oud bg-oud-brown text-oud-gold">
            <KeyRound className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold text-oud-brown">
            تعيين كلمة مرور جديدة
          </h1>
          <p className="mt-2 text-sm leading-7 text-oud-muted">
            أدخل كلمة مرور قوية لحسابك في عود ياز.
          </p>
        </div>

        {status === "checking" ? (
          <p className="rounded-oud border border-oud-brown/10 bg-oud-beige/20 p-3 text-sm leading-6 text-oud-muted">
            جاري التحقق من رابط الاستعادة...
          </p>
        ) : null}

        {status === "invalid" ? (
          <div className="space-y-4">
            <div className="rounded-oud border border-red-900/15 bg-red-900/10 p-3 text-sm leading-6 text-red-900">
              {error ?? "رابط الاستعادة غير صالح أو انتهت صلاحيته."}
            </div>
            <Link
              href="/forgot-password"
              className="block text-center text-sm font-semibold text-oud-brown hover:text-oud-gold"
            >
              طلب رابط جديد
            </Link>
          </div>
        ) : null}

        {status === "ready" || status === "success" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-oud border border-red-900/15 bg-red-900/10 p-3 text-sm leading-6 text-red-900">
                {error}
              </div>
            ) : null}
            <Input
              label="كلمة المرور الجديدة"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              dir="ltr"
              required
            />
            <Input
              label="تأكيد كلمة المرور"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              dir="ltr"
              required
            />
            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              حفظ كلمة المرور الجديدة
            </Button>
          </form>
        ) : null}
      </Card>
    </section>
  );
}
