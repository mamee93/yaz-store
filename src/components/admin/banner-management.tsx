import { ImageIcon, Pencil, Plus, Replace, Trash2 } from "lucide-react";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";
import {
  createBannerAction,
  deleteBannerAction,
  toggleBannerStatusAction,
  updateBannerAction
} from "@/features/banners/actions";
import type { BannerRow } from "@/features/banners/queries";

type BannerManagementProps = {
  banners: BannerRow[];
};

type BannerPlacement = "home_hero" | "offers" | "categories" | "seasonal";

type BannerSectionConfig = {
  placement: BannerPlacement;
  legacyPlacements?: string[];
  title: string;
  description: string;
  recommendedSize: string;
};

const bannerSections: BannerSectionConfig[] = [
  {
    placement: "home_hero",
    title: "بنر الصفحة الرئيسية الكبير",
    description: "يظهر أعلى الصفحة الرئيسية",
    recommendedSize: "1600x700"
  },
  {
    placement: "offers",
    title: "بنرات العروض",
    description: "تظهر في قسم العروض",
    recommendedSize: "1200x500"
  },
  {
    placement: "categories",
    legacyPlacements: ["category"],
    title: "بنرات التصنيفات",
    description: "تظهر قرب/داخل قسم التصنيفات",
    recommendedSize: "1200x500"
  },
  {
    placement: "seasonal",
    legacyPlacements: ["home_secondary"],
    title: "بنرات موسمية",
    description: "رمضان / العيد / اليوم الوطني",
    recommendedSize: "1600x700"
  }
];

const placementLabels: Record<string, string> = {
  home_hero: "بنر الصفحة الرئيسية الكبير",
  offers: "بنرات العروض",
  categories: "بنرات التصنيفات",
  seasonal: "بنرات موسمية",
  category: "بنرات التصنيفات",
  home_secondary: "بنرات موسمية"
};

export function BannerManagement({ banners }: BannerManagementProps) {
  return (
    <div className="min-w-0 space-y-6">
      <div className="grid gap-5 xl:grid-cols-2">
        {bannerSections.map((section) => {
          const sectionBanners = getBannersForSection(banners, section);
          const activeBanner = sectionBanners.find((banner) => banner.is_active) ?? sectionBanners[0] ?? null;

          return (
            <BannerSectionCard
              key={section.placement}
              section={section}
              activeBanner={activeBanner}
              bannersCount={sectionBanners.length}
            />
          );
        })}
      </div>

      <Card className="min-w-0 overflow-hidden p-5 shadow-none">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-oud-gold">إدارة متقدمة</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-oud-brown">
              كل البنرات
            </h2>
          </div>
          <Badge variant="soft">{banners.length} بنر</Badge>
        </div>

        {banners.length > 0 ? (
          <div className="space-y-4">
            {banners.map((banner) => (
              <BannerListItem key={banner.id} banner={banner} />
            ))}
          </div>
        ) : (
          <div className="rounded-oud border border-dashed border-oud-brown/15 bg-oud-beige/20 p-6 text-center text-sm text-oud-muted">
            لا توجد بنرات بعد. ابدأ بإضافة بنر من إحدى البطاقات أعلاه.
          </div>
        )}
      </Card>
    </div>
  );
}

function BannerSectionCard({
  section,
  activeBanner,
  bannersCount
}: {
  section: BannerSectionConfig;
  activeBanner: BannerRow | null;
  bannersCount: number;
}) {
  return (
    <Card className="overflow-hidden shadow-none">
      <div className="relative min-h-56 border-b border-oud-brown/10 bg-oud-beige/35">
        {activeBanner?.image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${activeBanner.image_url}")` }}
            role="img"
            aria-label={activeBanner.title_ar}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-oud-muted">
            <ImageIcon className="size-10" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-oud-brown/80 via-oud-brown/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-5 text-oud-ivory">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={activeBanner?.is_active ? "success" : "soft"}>
              {activeBanner?.is_active ? "نشط" : "لا يوجد بنر نشط"}
            </Badge>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
              {bannersCount} بنر
            </span>
          </div>
          <h3 className="font-display text-3xl font-bold">{section.title}</h3>
          <p className="text-sm text-oud-beige">{section.description}</p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoPill label="المكان" value={section.placement} />
          <InfoPill label="المقاس المقترح" value={section.recommendedSize} />
        </div>

        {activeBanner ? (
          <div className="rounded-oud border border-oud-brown/10 bg-oud-beige/20 p-4">
            <p className="text-xs font-semibold text-oud-gold">البنر الحالي</p>
            <h4 className="mt-2 text-base font-bold text-oud-brown">{activeBanner.title_ar}</h4>
            {activeBanner.subtitle_ar ? (
              <p className="mt-2 line-clamp-2 text-sm leading-7 text-oud-muted">
                {activeBanner.subtitle_ar}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-oud border border-dashed border-oud-brown/15 bg-oud-beige/20 p-4 text-sm text-oud-muted">
            لا يوجد بنر لهذا المكان بعد.
          </div>
        )}

        <div className="grid gap-3">
          {activeBanner ? (
            <>
              <details className="rounded-oud border border-oud-brown/10 bg-white p-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-oud-brown">
                  <Pencil className="size-4 text-oud-gold" aria-hidden="true" />
                  تعديل
                </summary>
                <div className="mt-4">
                  <BannerEditForm banner={activeBanner} />
                </div>
              </details>

              <details className="rounded-oud border border-oud-brown/10 bg-white p-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-oud-brown">
                  <Replace className="size-4 text-oud-gold" aria-hidden="true" />
                  تغيير الصورة
                </summary>
                <div className="mt-4">
                  <BannerImageOnlyForm banner={activeBanner} />
                </div>
              </details>

              <ConfirmActionButton
                action={deleteBannerAction.bind(null, activeBanner.id)}
                triggerLabel="حذف"
                confirmLabel="حذف نهائي"
                title="حذف البنر"
                description="سيتم حذف البنر ومحاولة حذف صوره من التخزين إذا لم تكن مستخدمة في مكان آخر."
                itemName={activeBanner.title_ar}
                variant="danger"
                size="sm"
                icon={<Trash2 className="size-4" />}
              />
            </>
          ) : null}

          <details className="rounded-oud border border-oud-brown/10 bg-white p-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-oud-brown">
              <Plus className="size-4 text-oud-gold" aria-hidden="true" />
              إضافة بنر جديد لهذا المكان
            </summary>
            <div className="mt-4">
              <BannerCreateForm placement={section.placement} />
            </div>
          </details>
        </div>
      </div>
    </Card>
  );
}

function BannerListItem({ banner }: { banner: BannerRow }) {
  const toggleAction = toggleBannerStatusAction.bind(null, banner.id, !banner.is_active);

  return (
    <div className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-4">
      <div className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <div
          className="min-h-32 rounded-oud border border-oud-brown/10 bg-oud-beige/35 bg-cover bg-center"
          style={{ backgroundImage: `url("${banner.image_url}")` }}
          role="img"
          aria-label={banner.title_ar}
        />
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
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

          <details className="rounded-oud border border-oud-brown/10 bg-white p-4">
            <summary className="cursor-pointer list-none text-sm font-bold text-oud-brown">
              تعديل كامل
            </summary>
            <div className="mt-4">
              <BannerEditForm banner={banner} />
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-2">
            <form action={toggleAction}>
              <Button type="submit" variant="secondary">
                {banner.is_active ? "إيقاف البنر" : "تفعيل البنر"}
              </Button>
            </form>
            <ConfirmActionButton
              action={deleteBannerAction.bind(null, banner.id)}
              triggerLabel="حذف"
              confirmLabel="حذف نهائي"
              title="حذف البنر"
              description="سيتم حذف البنر ومحاولة حذف صوره من التخزين إذا لم تكن مستخدمة في مكان آخر."
              itemName={banner.title_ar}
              variant="danger"
              size="sm"
              icon={<Trash2 className="size-4" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BannerCreateForm({ placement }: { placement: BannerPlacement }) {
  return (
    <form action={createBannerAction} className="grid min-w-0 gap-4 md:grid-cols-2">
      <Input label="العنوان" name="title_ar" required />
      <Input label="نص الزر" name="button_label_ar" placeholder="تسوق الآن" />
      <Textarea label="النص المختصر" name="subtitle_ar" className="md:col-span-2" />
      <input type="hidden" name="placement" value={placement} />
      <Input label="الترتيب" name="sort_order" type="number" min={0} defaultValue={0} />
      <Input label="الرابط" name="link_url" placeholder="/products" dir="ltr" />
      <label className="flex items-center gap-2 self-end rounded-oud border border-oud-brown/10 bg-oud-beige/20 px-3 py-3 text-sm font-semibold text-oud-brown">
        <input name="is_active" type="checkbox" defaultChecked className="size-4 accent-oud-brown" />
        نشط
      </label>
      <div className="md:col-span-2">
        <ImageUploadField
          name="image"
          label="صورة البنر"
          required
          helpText="PNG, JPG, WEBP, SVG. الحد الأقصى 5MB."
          previewAlt="معاينة صورة البنر"
        />
      </div>
      <div className="md:col-span-2">
        <Button type="submit">حفظ البنر</Button>
      </div>
    </form>
  );
}

function BannerEditForm({ banner }: { banner: BannerRow }) {
  const updateAction = updateBannerAction.bind(null, banner.id);

  return (
    <form action={updateAction} className="grid min-w-0 gap-4 md:grid-cols-2">
      <Input label="العنوان" name="title_ar" defaultValue={banner.title_ar} required />
      <Input label="نص الزر" name="button_label_ar" defaultValue={banner.button_label_ar ?? ""} />
      <Textarea
        label="النص المختصر"
        name="subtitle_ar"
        defaultValue={banner.subtitle_ar ?? ""}
        className="md:col-span-2"
      />
      <Select label="مكان الظهور" name="placement" defaultValue={normalizePlacement(banner.placement)} required>
        <PlacementOptions />
      </Select>
      <Input label="الترتيب" name="sort_order" type="number" min={0} defaultValue={banner.sort_order} />
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
      <div className="md:col-span-2">
        <ImageUploadField
          name="image"
          label="تغيير الصورة"
          currentImageUrl={banner.image_url}
          helpText="اتركها بدون اختيار للحفاظ على الصورة الحالية."
          previewAlt="معاينة صورة البنر"
        />
      </div>
      <div className="md:col-span-2">
        <Button type="submit">حفظ التعديلات</Button>
      </div>
    </form>
  );
}

function BannerImageOnlyForm({ banner }: { banner: BannerRow }) {
  const updateAction = updateBannerAction.bind(null, banner.id);

  return (
    <form action={updateAction} className="space-y-4">
      <input type="hidden" name="title_ar" value={banner.title_ar} />
      <input type="hidden" name="button_label_ar" value={banner.button_label_ar ?? ""} />
      <input type="hidden" name="subtitle_ar" value={banner.subtitle_ar ?? ""} />
      <input type="hidden" name="placement" value={normalizePlacement(banner.placement)} />
      <input type="hidden" name="sort_order" value={banner.sort_order} />
      <input type="hidden" name="link_url" value={banner.link_url ?? ""} />
      <input type="hidden" name="is_active" value={banner.is_active ? "true" : "false"} />
      <ImageUploadField
        name="image"
        label="اختيار صورة"
        currentImageUrl={banner.image_url}
        helpText="سيتم استبدال صورة البنر فقط مع الحفاظ على باقي البيانات."
        previewAlt="معاينة صورة البنر"
      />
      <Button type="submit">حفظ الصورة</Button>
    </form>
  );
}

function PlacementOptions() {
  return (
    <>
      {bannerSections.map((section) => (
        <option key={section.placement} value={section.placement}>
          {section.title}
        </option>
      ))}
    </>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-oud border border-oud-brown/10 bg-oud-beige/20 px-3 py-2">
      <p className="text-xs text-oud-muted">{label}</p>
      <p className="mt-1 font-semibold text-oud-brown">{value}</p>
    </div>
  );
}

function getBannersForSection(banners: BannerRow[], section: BannerSectionConfig) {
  const placements = new Set([section.placement, ...(section.legacyPlacements ?? [])]);

  return banners
    .filter((banner) => placements.has(banner.placement))
    .sort((a, b) => {
      if (a.is_active && !b.is_active) {
        return -1;
      }

      if (!a.is_active && b.is_active) {
        return 1;
      }

      return a.sort_order - b.sort_order;
    });
}

function normalizePlacement(placement: string): BannerPlacement {
  if (placement === "category") {
    return "categories";
  }

  if (placement === "home_secondary") {
    return "seasonal";
  }

  if (placement === "home_hero" || placement === "offers" || placement === "categories" || placement === "seasonal") {
    return placement;
  }

  return "offers";
}
