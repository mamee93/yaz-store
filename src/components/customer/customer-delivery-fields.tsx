"use client";

import { useMemo, useState } from "react";
import { Input, Select, Textarea } from "@/components/ui";
import { OMAN_GOVERNORATES, getGovernorateWilayats } from "@/constants/oman-delivery";

type CustomerDeliveryFieldsProps = {
  phone?: string | null;
  governorate?: string | null;
  wilayat?: string | null;
  area?: string | null;
  detailedAddress?: string | null;
  phoneRequired?: boolean;
};

const fallbackGovernorate = OMAN_GOVERNORATES[0]?.name ?? "مسقط";

export function CustomerDeliveryFields({
  phone,
  governorate,
  wilayat,
  area,
  detailedAddress,
  phoneRequired = true
}: CustomerDeliveryFieldsProps) {
  const initialGovernorate = governorate || "";
  const [selectedGovernorate, setSelectedGovernorate] = useState(initialGovernorate);
  const wilayats = useMemo(
    () => (selectedGovernorate ? getGovernorateWilayats(selectedGovernorate) : []),
    [selectedGovernorate]
  );
  const [selectedWilayat, setSelectedWilayat] = useState(
    wilayat && wilayats.includes(wilayat) ? wilayat : ""
  );

  function handleGovernorateChange(value: string) {
    const nextWilayats = value ? getGovernorateWilayats(value) : [];

    setSelectedGovernorate(value);
    setSelectedWilayat(nextWilayats.includes(selectedWilayat) ? selectedWilayat : "");
  }

  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-2">
      <Input
        label="رقم الهاتف"
        name="phone"
        type="tel"
        placeholder="9XXXXXXX"
        defaultValue={phone ?? ""}
        required={phoneRequired}
      />
      <Select
        label="المحافظة"
        name="governorate"
        value={selectedGovernorate}
        onChange={(event) => handleGovernorateChange(event.target.value)}
      >
        <option value="">اختر المحافظة</option>
        {OMAN_GOVERNORATES.map((item) => (
          <option key={item.name} value={item.name}>
            {item.name}
          </option>
        ))}
      </Select>
      <Select
        label="الولاية"
        name="wilayat"
        value={selectedWilayat}
        onChange={(event) => setSelectedWilayat(event.target.value)}
        disabled={!selectedGovernorate}
      >
        <option value="">اختر الولاية</option>
        {(wilayats.length > 0 ? wilayats : getGovernorateWilayats(fallbackGovernorate)).map(
          (item) => (
            <option key={item} value={item}>
              {item}
            </option>
          )
        )}
      </Select>
      <Input label="المنطقة" name="area" placeholder="مثال: الخوير" defaultValue={area ?? ""} />
      <Textarea
        label="العنوان التفصيلي"
        name="detailed_address"
        placeholder="رقم المبنى، الشارع، أقرب معلم"
        defaultValue={detailedAddress ?? ""}
        className="md:col-span-2"
      />
    </div>
  );
}
