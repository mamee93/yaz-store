import { Badge, Card, Input, Select, Textarea } from "@/components/ui";
import { adminBanners } from "./admin-static-data";

export function BannerManagement() {
  return (
    <div className="min-w-0 space-y-5">
      <Card className="max-w-4xl p-5 shadow-none">
        <h2 className="font-display text-2xl font-bold text-oud-brown">نموذج البنر</h2>
        <div className="mt-5 space-y-4">
          <Input label="العنوان" name="bannerTitle" />
          <Textarea label="النص المختصر" name="bannerSubtitle" />
          <Select label="المكان" name="placement" defaultValue="home">
            <option value="home">الرئيسية</option>
            <option value="offers">العروض</option>
            <option value="category">التصنيف</option>
          </Select>
          <Input label="رابط الزر" name="linkUrl" placeholder="/products" dir="ltr" />
          <div className="grid min-h-32 place-items-center rounded-oud border border-dashed border-oud-brown/20 bg-oud-beige/25 text-sm text-oud-muted">
            رفع صورة البنر لاحقاً
          </div>
          <div className="rounded-oud bg-oud-brown px-5 py-3 text-center text-sm font-semibold text-oud-ivory">
            حفظ تجريبي غير مفعّل
          </div>
        </div>
      </Card>

      <Card className="min-w-0 overflow-hidden shadow-none">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[40rem] text-right text-sm">
            <thead className="bg-oud-beige/35 text-xs text-oud-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">البنر</th>
                <th className="px-5 py-3 font-semibold">المكان</th>
                <th className="px-5 py-3 font-semibold">الترتيب</th>
                <th className="px-5 py-3 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oud-brown/10">
              {adminBanners.map((banner) => (
                <tr key={banner.id} className="bg-oud-pearl">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="h-12 w-20 rounded-oud bg-gradient-to-br from-oud-brown to-oud-gold" />
                      <span className="font-semibold text-oud-brown">{banner.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-oud-muted">{banner.placement}</td>
                  <td className="px-5 py-4 text-oud-muted">{banner.sort}</td>
                  <td className="px-5 py-4">
                    <Badge variant={banner.status === "نشط" ? "success" : "gold"}>
                      {banner.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
