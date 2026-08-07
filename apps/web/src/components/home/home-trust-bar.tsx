import { db } from "@/lib/db";
import { AppointmentStatus, ReviewStatus } from "@/generated/prisma/enums";

async function getTrustStats() {
  try {
    const activeBusinessesCount = await db.business.count({
      where: {
        status: {
          in: ["ACTIVE_PRIVATE", "ACTIVE_MARKETPLACE"],
        },
      },
    });

    const completedAppointmentsCount = await db.appointment.count({
      where: {
        status: AppointmentStatus.COMPLETED,
      },
    });

    const averageRating = await db.review.aggregate({
      _avg: {
        rating: true,
      },
      where: {
        status: ReviewStatus.APPROVED,
      },
    });

    const totalApprovedReviews = await db.review.count({
      where: {
        status: ReviewStatus.APPROVED,
      },
    });

    const totalReviews = await db.review.count();

    return {
      businessesCount: activeBusinessesCount,
      appointmentsCount: completedAppointmentsCount,
      averageRating: averageRating._avg?.rating ?? 0,
      verifiedPercentage:
        totalReviews > 0 ? Math.round((totalApprovedReviews / totalReviews) * 100) : 100,
    };
  } catch (error) {
    console.error("[home-trust-bar] Failed to fetch stats:", error);
    return {
      businessesCount: 0,
      appointmentsCount: 0,
      averageRating: 0,
      verifiedPercentage: 100,
    };
  }
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
  }
  return num > 0 ? `${num}+` : "0";
}

export async function HomeTrustBar() {
  const { businessesCount, appointmentsCount, averageRating, verifiedPercentage } =
    await getTrustStats();

  const stats = [
    { value: formatNumber(businessesCount), label: "Kayıtlı Uzman" },
    { value: formatNumber(appointmentsCount), label: "Alınan Randevu" },
    {
      value: `${averageRating > 0 ? averageRating.toFixed(1) : "0"} / 5`,
      label: "Ortalama Değerlendirme",
    },
    { value: `%${verifiedPercentage}`, label: "Doğrulanmış Yorum" },
  ] as const;

  return (
    <section className="bg-surface-cream px-4 py-7 md:py-9">
      <div className="mx-auto max-w-5xl">
        <dl className="grid grid-cols-2 gap-y-6 md:grid-cols-4 md:gap-0 md:divide-x md:divide-border/50">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-0.5 px-4 text-center"
            >
              <dt className="text-xl font-bold tracking-[-0.02em] text-foreground md:text-2xl">
                {value}
              </dt>
              <dd className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
