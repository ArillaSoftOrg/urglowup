import { z } from "zod";

// Mirrors apps/web/src/lib/password-policy.ts's passwordSchema — duplicated
// (not imported) because that file lives in apps/web and pulls in no other
// dependencies, matching this session's established pattern of duplicating
// small stable primitives rather than reaching back into apps/web from a
// shared package. Keep the two in sync if the policy changes.
export const passwordSchema = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı.")
  .regex(/[A-Z]/, "Şifre en az bir büyük harf içermeli.")
  .regex(/[a-z]/, "Şifre en az bir küçük harf içermeli.")
  .regex(/[0-9]/, "Şifre en az bir rakam içermeli.")
  .regex(/[^A-Za-z0-9]/, "Şifre en az bir özel karakter içermeli (!@#$% vb.).");

export const signInSchema = z.object({
  email: z.email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(1, "Şifrenizi girin."),
});

export type SignInBody = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    name: z.string().min(2, "Ad soyad en az 2 karakter olmalı."),
    email: z.email("Geçerli bir e-posta adresi girin."),
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Şifre tekrarını girin."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Şifreler eşleşmiyor.",
  });

export type SignUpBody = z.infer<typeof signUpSchema>;
