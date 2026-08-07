import { z } from "zod";

export const PASSWORD_GUIDANCE_MESSAGE =
  "Güçlü bir şifre oluşturun. Şifreniz en az 8 karakter, bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir.";

export const PASSWORD_ALL_DONE_MESSAGE = "Güçlü şifre başarıyla oluşturuldu.";

export const passwordSchema = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı.")
  .regex(/[A-Z]/, "Şifre en az bir büyük harf içermeli.")
  .regex(/[a-z]/, "Şifre en az bir küçük harf içermeli.")
  .regex(/[0-9]/, "Şifre en az bir rakam içermeli.")
  .regex(/[^A-Za-z0-9]/, "Şifre en az bir özel karakter içermeli (!@#$% vb.).");

export const PASSWORD_REQUIREMENTS = [
  { test: (v: string) => v.length >= 8, label: "En az 8 karakter" },
  { test: (v: string) => /[A-Z]/.test(v), label: "En az bir büyük harf" },
  { test: (v: string) => /[a-z]/.test(v), label: "En az bir küçük harf" },
  { test: (v: string) => /[0-9]/.test(v), label: "En az bir rakam" },
  { test: (v: string) => /[^A-Za-z0-9]/.test(v), label: "En az bir özel karakter" },
] as const;
