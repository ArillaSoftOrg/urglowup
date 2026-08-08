import { z } from "zod";

export const registerDeviceBodySchema = z.object({
  expoPushToken: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export type RegisterDeviceBody = z.infer<typeof registerDeviceBodySchema>;
