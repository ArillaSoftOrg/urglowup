import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { db } from "@/lib/db";
import { optimizeBusinessLogoUrl } from "@/lib/optimized-media";
import { nowInBusinessTimezone } from "@/lib/constants/booking";
import {
  CALENDAR_FETCH_MONTHS_BEFORE,
  CALENDAR_FETCH_MONTHS_AFTER,
} from "@/lib/constants/calendar";

export async function getCustomerAppointments(userId: string) {
  return db.appointment.findMany({
    where: { customerId: userId },
    include: {
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
        orderBy: { sortOrder: "asc" },
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
    },
    orderBy: { requestedDate: "desc" },
  });
}

export type CustomerAppointment = Awaited<
  ReturnType<typeof getCustomerAppointments>
>[number];

export async function getBusinessForBooking(slug: string) {
  const business = await db.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      logoUrl: true,
      city: true,
      district: true,
      address: true,
      maxGroupBookingGuests: true,
      media: {
        where: {
          status: "ACTIVE",
          type: "LOGO",
        },
        select: {
          type: true,
          publicId: true,
          cropX: true,
          cropY: true,
          cropWidth: true,
          cropHeight: true,
        },
        take: 1,
      },
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
      professionals: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          displayName: true,
          title: true,
          avatarUrl: true,
          services: { select: { serviceId: true } },
        },
      },
      hours: true,
      holidaySuggestions: {
        where: { state: "APPLIED" },
        select: { holiday: { select: { date: true } } },
      },
    },
  });

  if (!business) {
    return null;
  }

  const logoMedia = business.media[0];

  return {
    ...business,
    logoUrl: optimizeBusinessLogoUrl(logoMedia, business.logoUrl),
  };
}

export type BookingBusiness = NonNullable<
  Awaited<ReturnType<typeof getBusinessForBooking>>
>;

export interface CalendarDataRange {
  rangeStart: Date;
  rangeEnd: Date;
}

function defaultCalendarRange(): CalendarDataRange {
  const now = nowInBusinessTimezone();
  return {
    rangeStart: startOfMonth(subMonths(now, CALENDAR_FETCH_MONTHS_BEFORE)),
    rangeEnd: endOfMonth(addMonths(now, CALENDAR_FETCH_MONTHS_AFTER)),
  };
}

/**
 * Fetches everything the appointment calendar needs to render Day/Week/Month/
 * Staff/List views for a date range: appointments, blocked times, active
 * professionals, active services, and configured business hours.
 */
export async function getBusinessCalendarData(
  businessId: string,
  options?: { rangeStart?: Date; rangeEnd?: Date }
) {
  const { rangeStart, rangeEnd } = {
    ...defaultCalendarRange(),
    ...options,
  };

  const [appointments, blockedTimes, professionals, services, businessHours] =
    await Promise.all([
      db.appointment.findMany({
        where: {
          businessId,
          requestedDate: { gte: rangeStart, lte: rangeEnd },
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              durationMinutes: true,
              price: true,
              priceType: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
          professional: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
          items: {
            orderBy: { sortOrder: "asc" },
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
        },
        orderBy: { requestedTime: "asc" },
      }),
      db.blockedTime.findMany({
        where: {
          businessId,
          date: { gte: rangeStart, lte: rangeEnd },
        },
        include: {
          professional: {
            select: { id: true, displayName: true },
          },
        },
        orderBy: { startTime: "asc" },
      }),
      db.professional.findMany({
        where: { businessId, isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      db.businessService.findMany({
        where: { businessId, isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      db.businessHour.findMany({
        where: { businessId },
      }),
    ]);

  return {
    appointments,
    blockedTimes,
    professionals,
    services,
    businessHours,
    rangeStart,
    rangeEnd,
  };
}

export type CalendarAppointment = Awaited<
  ReturnType<typeof getBusinessCalendarData>
>["appointments"][number];

export type CalendarBlockedTime = Awaited<
  ReturnType<typeof getBusinessCalendarData>
>["blockedTimes"][number];

export type CalendarProfessional = Awaited<
  ReturnType<typeof getBusinessCalendarData>
>["professionals"][number];

export type CalendarService = Awaited<
  ReturnType<typeof getBusinessCalendarData>
>["services"][number];

export type CalendarBusinessHour = Awaited<
  ReturnType<typeof getBusinessCalendarData>
>["businessHours"][number];

/**
 * One row per customer who has a prior appointment with this business, most
 * recent appointment first — used by the calendar's "new appointment"
 * customer picker.
 */
export async function getBusinessCustomerSummaries(businessId: string) {
  return db.appointment.findMany({
    where: { businessId },
    distinct: ["customerId"],
    orderBy: { requestedDate: "desc" },
    select: {
      customerId: true,
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
    },
  });
}

export type CalendarCustomerSummary = Awaited<
  ReturnType<typeof getBusinessCustomerSummaries>
>[number];
