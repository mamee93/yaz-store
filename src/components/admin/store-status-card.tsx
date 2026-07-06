import { Badge, Card, Price } from "@/components/ui";
import type { StoreSettingsRead } from "@/features/store-settings/queries";

type StoreStatusCardProps = {
  settings: StoreSettingsRead | null;
};

export function StoreStatusCard({ settings }: StoreStatusCardProps) {
  const isOpen = settings?.is_store_open ?? true;

  return (
    <Card className="p-5 shadow-none">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold text-oud-muted">حالة المتجر</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-oud-brown">
              {settings?.store_name ?? settings?.store_name_ar ?? "عود ياز"}
            </h2>
            <Badge variant={isOpen ? "success" : "danger"}>
              {isOpen ? "مفتوح للطلبات" : "مغلق مؤقتا"}
            </Badge>
          </div>
          {!isOpen ? (
            <p className="mt-2 text-sm text-oud-muted">
              {settings?.maintenance_message ?? settings?.maintenance_message_ar}
            </p>
          ) : null}
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2 md:text-left">
          <StatusMetric
            label="الحد الأدنى للطلب"
            value={<Price value={settings?.minimum_order_amount ?? 0} />}
          />
          <StatusMetric
            label="الضريبة"
            value={settings?.is_tax_enabled ? `${settings.tax_rate}%` : "غير مفعلة"}
          />
        </div>
      </div>
    </Card>
  );
}

function StatusMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-oud bg-oud-beige/35 px-4 py-3">
      <p className="text-xs text-oud-muted">{label}</p>
      <div className="mt-1 font-semibold text-oud-brown">{value}</div>
    </div>
  );
}
