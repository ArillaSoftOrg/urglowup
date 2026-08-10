// Mirrors packages/domain/src/booking/queries.ts's APPOINTMENT_LIST_INCLUDE shape,
// as returned by GET /api/v1/appointments (paginated) and GET /api/v1/appointments/:id.

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "REJECTED"
  | "CANCELLED_BY_CUSTOMER"
  | "CANCELLED_BY_BUSINESS"
  | "COMPLETED"
  | "NO_SHOW";

export interface Appointment {
  id: string;
  status: AppointmentStatus;
  requestedDate: string;
  requestedTime: string;
  totalDurationMinutes: number | null;
  totalPrice: string | null;
  customerNote: string | null;
  cancelledReason: string | null;
  createdAt: string;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    price: string | null;
    priceType: string;
  };
  business: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    address: string | null;
    city: string | null;
    district: string | null;
  };
  review: { id: string; rating: number; status: string } | null;
}

export const CUSTOMER_CANCELLABLE_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED"];

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Onay bekliyor",
  CONFIRMED: "Onaylandı",
  CHECKED_IN: "Giriş yapıldı",
  REJECTED: "Reddedildi",
  CANCELLED_BY_CUSTOMER: "İptal edildi",
  CANCELLED_BY_BUSINESS: "İşletme iptal etti",
  COMPLETED: "Tamamlandı",
  NO_SHOW: "Gelinmedi",
};
