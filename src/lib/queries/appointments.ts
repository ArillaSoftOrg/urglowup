import { db } from "@/lib/db";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export async function getCustomerAppointments(userId: string) {
  return db.appointment.findMany({
    where: { customerId: userId },
    include: {
      service: {
        select: {
          name: true,
          durationMinutes: true,
          price: true,
          priceType: true,
        },
      },
      business: {
        select: { name: true, slug: true, logoUrl: true },
      },
      review: {
        select: { id: true, rating: true, status: true },
      },
    },
    orderBy: { requestedDate: "desc" },
  });
}

export type CustomerAppointment = Awaited<
  ReturnType<typeof getCustomerAppointments>
>[number];

export async function getBusinessAppointments(
  businessId: string,
  statusFilter?: AppointmentStatus[]
) {
  return db.appointment.findMany({
    where: {
      businessId,
      ...(statusFilter ? { status: { in: statusFilter } } : {}),
    },
    include: {
      service: { select: { name: true, durationMinutes: true } },
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { requestedDate: "desc" },
  });
}

export type BusinessAppointment = Awaited<
  ReturnType<typeof getBusinessAppointments>
>[number];

export async function getBusinessForBooking(slug: string) {
  return db.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      logoUrl: true,
      services: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          durationMinutes: true,
          price: true,
          priceType: true,
        },
      },
      hours: true,
      holidaySuggestions: {
        where: { state: "APPLIED" },
        select: { holiday: { select: { date: true } } },
      },
    },
  });
}

export type BookingBusiness = NonNullable<
  Awaited<ReturnType<typeof getBusinessForBooking>>
>;
