import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";
import { BannerImageField } from "@/components/admin/banner-image-field";
import {
  createBannerAction,
  toggleBannerStatusAction,
  updateBannerAction
} from "@/features/banners/actions";
import type { BannerRow } from "@/features/banners/queries";

type BannerManagementProps = {
  banners: BannerRow[];
};

const placementLabels: Record<string, string> = {
  home_hero: "رئيسية - هيرو",
  home_secondary: "رئيسية - ثانوي",
  offers: "العروض",
  category: "التصنيف"
};

export function BannerManagement({ banners }: BannerManagementProps) {
  return (
    <div className="min-w-0 space-y-5">
      <Card className="max-w-5xl p-5 shadow-none">
        <h2 className="font-display text-2xl font-bold text-oud-brown">إضافة بنر جديد</h2>
        <form action={createBannerAction} className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
          <Input label="العنوان" name="title_ar" required />
          <Input label="نص الزر" name="button_label_ar" placeholder="تسوق الآن" />
          <Textarea label="النص المختصر" name="subtitle_ar" className="md:col-span-2" />
          <Select label="المكان" name="placement" defaultValue="home_hero" required>
            <PlacementOptions />
          </Select>
          <Input label="الترتيب" name="sort_order" type="number" min={0} defaultValue={0} />
          <Input label="الرابط" name="link_url" placeholder="/products" dir="ltr" />
          <label className="flex items-center gap-2 self-end rounded-oud border border-oud-brown/10 bg-oud-beige/20 px-3 py-3 text-sm font-semibold text-oud-brown">
            <input name="is_active" type="checkbox" defaultChecked className="size-4 accent-oud-brown" />
            نشط
          </label>
          <div className="md:col-span-2">
            <BannerImageField required />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">حفظ البنر</Button>
          </div>
        </form>
      </Card>

      <Card className="min-w-0 overflow-hidden p-5 shadow-none">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl font-bold text-oud-brown">البنرات الحالية</h2>
          <Badge variant="soft">{banners.length} بنر</Badge>
        </div>

        {banners.length > 0 ? (
          <div className="space-y-4">
            {banners.map((banner) => (
              <BannerEditCard key={banner.id} banner={banner} />
            ))}
          </div>
        ) : (
          <div className="rounded-oud border border-dashed border-oud-brown/15 bg-oud-beige/20 p-6 text-center text-sm text-oud-muted">
            لا توجد بنرات بعد. أضف أول بنر من النموذج أعلاه.
          </div>
        )}
      </Card>
    </div>
  );
}

function BannerEditCard({ banner }: { banner: BannerRow }) {
  const updateAction = updateBannerAction.bind(null, banner.id);
  const toggleAction = toggleBannerStatusAction.bind(null, banner.id, !banner.is_active);

  return (
    <div className="min-w-0 rounded-oud border border-oud-brown/10 bg-oud-pearl p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-oud-brown">{banner.title_ar}</h3>
          <p className="text-xs text-oud-muted">
            {placementLabels[banner.placement] ?? banner.placement} · ترتيب {banner.sort_order}
          </p>
        </div>
        <Badge variant={banner.is_active ? "success" : "soft"}>
          {banner.is_active ? "نشط" : "متوقف"}
        </Badge>
      </div>

      <form action={updateAction} className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <BannerImageField currentImageUrl={banner.image_url} label="تغيير الصورة" />
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <Input label="العنوان" name="title_ar" defaultValue={banner.title_ar} required />
          <Input label="نص الزر" name="button_label_ar" defaultValue={banner.button_label_ar ?? ""} />
          <Textarea
            label="النص المختصر"
            name="subtitle_ar"
            defaultValue={banner.subtitle_ar ?? ""}
            className="md:col-span-2"
          />
          <Select label="المكان" name="placement" defaultValue={banner.placement} required>
            <PlacementOptions />
          </Select>
          <Input
            label="الترتيب"
            name="sort_order"
            type="number"
            min={0}
            defaultValue={banner.sort_order}
          />
          <Input label="الرابط" name="link_url" defaultValue={banner.link_url ?? ""} dir="ltr" />
          <label className="flex items-center gap-2 self-end rounded-oud border border-oud-brown/10 bg-oud-beige/20 px-3 py-3 text-sm font-semibold text-oud-brown">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={banner.is_active}
              className="size-4 accent-oud-brown"
            />
            نشط
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit">حفظ التعديلات</Button>
            <Button type="submit" formAction={toggleAction} variant="secondary">
              {banner.is_active ? "إيقاف البنر" : "تفعيل البنر"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function PlacementOptions() {
  return (
    <>
      <option value="home_hero">رئيسية - هيرو</option>
      <option value="home_secondary">رئيسية - ثانوي</option>
      <option value="offers">العروض</option>
      <option value="category">التصنيف</option>
    </>
  );
}
