import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z
    .string()
    .max(20)
    .regex(/^[+\d\s()-]*$/)
    .nullable()
    .optional(),
});

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;

export const updatePreferencesSchema = z.object({
  emailTransactional: z.boolean().optional(),
  whatsappTransactional: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),
  whatsappMarketing: z.boolean().optional(),
});

export type UpdatePreferencesBody = z.infer<typeof updatePreferencesSchema>;
