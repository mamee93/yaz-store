import { z } from "zod";
import { ADMIN_ROLES } from "@/constants/admin-roles";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

export const teamMemberSchema = z.object({
  full_name: z.string().trim().min(2, "يرجى إدخال الاسم الكامل"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("البريد الإلكتروني غير صحيح"),
  phone: optionalText,
  temporary_password: z
    .string()
    .min(8, "كلمة المرور المؤقتة يجب أن تكون 8 أحرف على الأقل"),
  role: z.enum(ADMIN_ROLES, {
    required_error: "اختر دور الموظف",
    invalid_type_error: "الدور غير صحيح"
  }),
  is_active: z.preprocess((value) => value === "on" || value === "true", z.boolean())
});

export const updateTeamMemberSchema = z.object({
  full_name: z.string().trim().min(2, "يرجى إدخال الاسم الكامل"),
  display_name: optionalText,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("البريد الإلكتروني غير صحيح"),
  phone: optionalText,
  role: z.enum(ADMIN_ROLES, {
    required_error: "اختر دور الموظف",
    invalid_type_error: "الدور غير صحيح"
  }),
  is_active: z.preprocess((value) => value === "on" || value === "true", z.boolean())
});

export const updateTeamMemberRoleSchema = z.object({
  role: z.enum(ADMIN_ROLES, {
    required_error: "اختر دور الموظف",
    invalid_type_error: "الدور غير صحيح"
  })
});
