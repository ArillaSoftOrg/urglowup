import type { ApiClient, Page } from "./client";
import type {
  CreateAppointmentBody,
  RescheduleAppointmentBody,
  SubmitReviewBody,
  UpdateProfileBody,
  UpdatePreferencesBody,
  RegisterDeviceBody,
} from "@urglowup/validation";

// Thin typed wrappers over ApiClient for each /api/v1 resource. Response
// shapes are intentionally `unknown`-generic where packages/domain doesn't
// (yet) export a standalone DTO type — callers can supply their own type
// param until that's tightened up.

export function createApiResources(client: ApiClient) {
  return {
    account: {
      me: () => client.get<unknown>("/api/v1/account/me"),
      updateMe: (body: UpdateProfileBody) => client.patch<unknown>("/api/v1/account/me", body),
      deleteMe: () => client.delete<{ deleted: boolean }>("/api/v1/account/me"),
      preferences: () => client.get<unknown>("/api/v1/account/preferences"),
      updatePreferences: (body: UpdatePreferencesBody) =>
        client.patch<unknown>("/api/v1/account/preferences", body),
      reviews: (cursor?: string) =>
        client.get<Page<unknown>>("/api/v1/account/reviews", { query: { cursor } }),
    },
    categories: {
      list: () => client.get<{ data: unknown[] }>("/api/v1/categories"),
    },
    businesses: {
      search: (query: Record<string, string | number | boolean | undefined>) =>
        client.get<{ data: unknown[] }>("/api/v1/businesses", { query }),
      bySlug: (slug: string) => client.get<unknown>(`/api/v1/businesses/${slug}`),
      availability: (slug: string, serviceId: string, date: string, professionalId?: string) =>
        client.get<{ date: string; slots: string[] }>(`/api/v1/businesses/${slug}/availability`, {
          query: { serviceId, date, professionalId },
        }),
      reviews: (slug: string, cursor?: string) =>
        client.get<Page<unknown>>(`/api/v1/businesses/${slug}/reviews`, { query: { cursor } }),
    },
    appointments: {
      list: (cursor?: string) => client.get<Page<unknown>>("/api/v1/appointments", { query: { cursor } }),
      create: (body: CreateAppointmentBody, idempotencyKey: string) =>
        client.post<{ appointmentId: string }>("/api/v1/appointments", body, { idempotencyKey }),
      byId: (id: string) => client.get<unknown>(`/api/v1/appointments/${id}`),
      cancel: (id: string, reason?: string) =>
        client.post<{ appointmentId: string }>(`/api/v1/appointments/${id}/cancel`, { reason }),
      reschedule: (id: string, body: RescheduleAppointmentBody) =>
        client.post<{ appointmentId: string }>(`/api/v1/appointments/${id}/reschedule`, body),
      review: (id: string, body: SubmitReviewBody) =>
        client.post<{ reviewId: string }>(`/api/v1/appointments/${id}/review`, body),
    },
    favorites: {
      list: () => client.get<{ data: unknown[] }>("/api/v1/favorites"),
      add: (businessId: string) =>
        client.post<{ isFavorited: boolean }>(`/api/v1/favorites/${businessId}`),
      remove: (businessId: string) =>
        client.delete<{ isFavorited: boolean }>(`/api/v1/favorites/${businessId}`),
    },
    devices: {
      register: (body: RegisterDeviceBody) => client.post<{ id: string }>("/api/v1/devices", body),
      remove: (id: string) => client.delete<{ removed: boolean }>(`/api/v1/devices/${id}`),
    },
    notifications: {
      list: (cursor?: string) => client.get<Page<unknown>>("/api/v1/notifications", { query: { cursor } }),
      markRead: (id: string) => client.post<{ read: boolean }>(`/api/v1/notifications/${id}/read`),
    },
  };
}

export type ApiResources = ReturnType<typeof createApiResources>;
