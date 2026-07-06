import { requireAdmin } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ShippingZoneRow = Database["public"]["Tables"]["shipping_zones"]["Row"];
export type ShippingStatus = "active" | "inactive" | "free_available";

export type ShippingStats = {
  total: number;
  active: number;
  inactive: number;
  freeShippingEnabled: number;
};

export async function getActiveShippingZones() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipping_zones")
    .select(
      "id,name,city,area,delivery_fee_omr,free_shipping_minimum_omr,estimated_delivery_time,is_active,sort_order,created_at,updated_at"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("city", { ascending: true })
    .returns<ShippingZoneRow[]>();

  if (error) {
    console.error("Failed to read active shipping zones", error);
    return [];
  }

  return data ?? [];
}

export async function getAdminShippingZones(search?: string) {
  const admin = await requireAdmin();

  if (!admin) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipping_zones")
    .select(
      "id,name,city,area,delivery_fee_omr,free_shipping_minimum_omr,estimated_delivery_time,is_active,sort_order,created_at,updated_at"
    )
    .order("sort_order", { ascending: true })
    .order("city", { ascending: true })
    .returns<ShippingZoneRow[]>();

  if (error) {
    console.error("Failed to read admin shipping zones", error);
    return [];
  }

  const normalizedSearch = normalizeSearch(search);

  return (data ?? []).filter((zone) => {
    if (!normalizedSearch) {
      return true;
    }

    return [zone.name, zone.city, zone.area]
      .some((value) => normalizeSearch(value).includes(normalizedSearch));
  });
}

export async function getAdminShippingStats() {
  const zones = await getAdminShippingZones();

  return zones.reduce<ShippingStats>(
    (stats, zone) => {
      stats.total += 1;

      if (zone.is_active) {
        stats.active += 1;
      } else {
        stats.inactive += 1;
      }

      if (zone.free_shipping_minimum_omr !== null) {
        stats.freeShippingEnabled += 1;
      }

      return stats;
    },
    {
      total: 0,
      active: 0,
      inactive: 0,
      freeShippingEnabled: 0
    }
  );
}

export async function getAdminShippingZoneById(zoneId: string) {
  const admin = await requireAdmin();

  if (!admin) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipping_zones")
    .select(
      "id,name,city,area,delivery_fee_omr,free_shipping_minimum_omr,estimated_delivery_time,is_active,sort_order,created_at,updated_at"
    )
    .eq("id", zoneId)
    .maybeSingle()
    .returns<ShippingZoneRow | null>();

  if (error) {
    console.error("Failed to read admin shipping zone", error);
    return null;
  }

  return data;
}

export function getShippingStatus(zone: ShippingZoneRow): ShippingStatus {
  if (!zone.is_active) {
    return "inactive";
  }

  if (zone.free_shipping_minimum_omr !== null) {
    return "free_available";
  }

  return "active";
}

function normalizeSearch(value?: string | null) {
  return value?.trim().toLocaleLowerCase("ar-OM") ?? "";
}
