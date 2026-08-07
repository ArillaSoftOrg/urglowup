export interface BookingItemInput {
  guestName: string;
  guestIndex: number;
  serviceId: string;
  professionalId: string | null;
  durationMinutes: number;
  priceSnapshot: number | null;
}

export interface CreateAppointmentInput {
  businessId: string;
  customerId: string;
  primaryServiceId: string;
  primaryProfessionalId: string | null;
  couponId: string | null;
  discountAmount: number | null;
  /** "YYYY-MM-DD" */
  requestedDate: string;
  /** "HH:mm" */
  requestedTime: string;
  customerNote: string | null;
  firstVisit: boolean | null;
  isGroup: boolean;
  guestCount: number;
  totalDurationMinutes: number;
  totalPrice: number | null;
  items: BookingItemInput[];
  /**
   * Client-generated key, stable for the lifetime of one form submission.
   * A retried request with the same key replays the first response instead
   * of re-executing the mutation.
   */
  idempotencyKey?: string;
}

export type CreateAppointmentFailureReason =
  | "SLOT_TAKEN"
  | "DUPLICATE_CUSTOMER_BOOKING"
  | "COUPON_EXHAUSTED";

export type CreateAppointmentResult =
  | { ok: true; appointmentId: string }
  | { ok: false; reason: CreateAppointmentFailureReason };
