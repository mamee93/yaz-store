import { z } from "zod";
import { ADMIN_ROLES } from "@/constants/admin-roles";

export const teamMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("البريد الإلكتروني غير صحيح"),
  display_name: z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }, z.string().nullable()),
  role: z.enum(ADMIN_ROLES, {
    required_error: "اختر دور الموظف",
    invalid_type_error: "الدور غير صحيح"
  })
});

export const updateTeamMemberSchema = z.object({
  display_name: z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }, z.string().nullable()),
  role: z.enum(ADMIN_ROLES, {
    required_error: "اختر دور الموظف",
    invalid_type_error: "الدور غير صحيح"
  })
});
