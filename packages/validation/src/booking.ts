import { z } from "zod";

export const createAppointmentBodySchema = z.object({
  businessId: z.string().min(1),
  serviceId: z.string().min(1),
  professionalId: z.string().min(1).nullable().optional(),
  couponId: z.string().min(1).nullable().optional(),
  discountAmount: z.number().nonnegative().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  customerNote: z.string().max(500).nullable().optional(),
  firstVisit: z.boolean().nullable().optional(),
  items: z
    .array(
      z.object({
        guestName: z.string().min(1).max(80),
        guestIndex: z.number().int().min(0).max(20),
        serviceId: z.string().min(1),
        professionalId: z.string().min(1).nullable().optional(),
      }),
    )
    .min(1)
    .max(50)
    .optional(),
});

export type CreateAppointmentBody = z.infer<typeof createAppointmentBodySchema>;

export const rescheduleAppointmentBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export type RescheduleAppointmentBody = z.infer<typeof rescheduleAppointmentBodySchema>;

export const cancelAppointmentBodySchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CancelAppointmentBody = z.infer<typeof cancelAppointmentBodySchema>;

export const availabilityQuerySchema = z.object({
  serviceId: z.string().min(1),
  professionalId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
