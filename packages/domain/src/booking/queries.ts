import { db } from "@urglowup/db";

const APPOINTMENT_LIST_INCLUDE = {
  service: {
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      price: true,
      priceType: true,
    },
  },
  items: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      guestName: true,
      guestIndex: true,
      durationMinutes: true,
      priceSnapshot: true,
      service: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          price: true,
          priceType: true,
        },
      },
      professional: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  },
  business: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      address: true,
      city: true,
      district: true,
      latitude: true,
      longitude: true,
    },
  },
  review: {
    select: { id: true, rating: true, status: true },
  },
};

export async function getCustomerAppointments(userId: string) {
  return db.appointment.findMany({
    where: { customerId: userId },
    include: APPOINTMENT_LIST_INCLUDE,
    orderBy: { requestedDate: "desc" },
  });
}

export type CustomerAppointment = Awaited<ReturnType<typeof getCustomerAppointments>>[number];

/** Cursor-paginated variant for API v1 (see packages/validation pagination convention). */
export async function listCustomerAppointments(
  userId: string,
  options: { cursor?: string; limit: number },
) {
  const rows = await db.appointment.findMany({
    where: { customerId: userId },
    include: APPOINTMENT_LIST_INCLUDE,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: options.limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > options.limit;
  const data = hasMore ? rows.slice(0, options.limit) : rows;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor };
}

export async function getAppointmentById(userId: string, appointmentId: string) {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: APPOINTMENT_LIST_INCLUDE,
  });

  if (!appointment || appointment.customerId !== userId) {
    return { ok: false as const, reason: "NOT_FOUND" as const };
  }

  return { ok: true as const, appointment };
}
