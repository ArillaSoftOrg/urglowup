import type { AdminBusiness, AdminBusinessDetail } from "@/lib/queries/admin";
import type { BusinessStatus } from "@/generated/prisma/enums";
import { calculateProfileCompletion } from "@/lib/profile-completion";

export interface Signal {
  id: string;
  label: string;
  severity: "high" | "medium" | "low";
  description: string;
  actionable?: boolean;
}

export interface BusinessSignals {
  risks: Signal[];
  opportunities: Signal[];
  riskScore: number;
}

function buildProfileCompletionData(
  business: AdminBusiness | AdminBusinessDetail
) {
  return {
    name: business.name,
    description: business.description,
    phone: business.phone,
    whatsapp: business.whatsapp,
    city: business.city,
    address: business.address,
    coverImageUrl: business.coverImageUrl,
    logoUrl: business.logoUrl,
    categories: business.categories.map((c) => ({ categoryId: c.categoryId })),
    services: business.services.map((s) => ({ id: s.id })),
    hours: business.hours.map((h) => ({ id: h.id })),
    media: business.media.map((m) => ({ id: m.id })),
  };
}

function isActiveStatus(status: BusinessStatus): boolean {
  return status === "ACTIVE_PRIVATE" || status === "ACTIVE_MARKETPLACE";
}

function getDaysAgo(date: Date | null): number | null {
  if (!date) return null;
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function computeBusinessSignals(
  business: AdminBusiness | AdminBusinessDetail
): BusinessSignals {
  const risks: Signal[] = [];
  const opportunities: Signal[] = [];
  let riskScore = 0;

  const completion = calculateProfileCompletion(
    buildProfileCompletionData(business)
  );
  const daysLastActive = getDaysAgo(business.lastActivityAt);

  // Risk signals (only for active businesses)
  if (isActiveStatus(business.status)) {
    // Low profile
    if (completion.score < 60) {
      risks.push({
        id: "low-profile",
        label: "Profil % Düşük",
        severity: "high",
        description: `Profil %${completion.score} tamamlı. En az %60'a çıkarak müşteri güvenini artırın.`,
        actionable: true,
      });
      riskScore += 3;
    }

    // No services
    if (business.services.length === 0) {
      risks.push({
        id: "no-services",
        label: "Hizmet Yok",
        severity: "high",
        description: "Herhangi bir aktif hizmet tanımlanmamış.",
        actionable: true,
      });
      riskScore += 3;
    }

    // No cover image
    if (!business.coverImageUrl) {
      risks.push({
        id: "no-cover",
        label: "Kapak Fotoğrafı Yok",
        severity: "medium",
        description: "Kapak fotoğrafı profil sayfasının görünümünü iyileştirir.",
        actionable: true,
      });
      riskScore += 2;
    }

    // No logo
    if (!business.logoUrl) {
      risks.push({
        id: "no-logo",
        label: "Logo Yok",
        severity: "medium",
        description: "Logo markanızı tanıyabilir kılar.",
        actionable: true,
      });
      riskScore += 2;
    }

    // Geocoding failed
    if (
      "geocodingError" in business &&
      business.geocodingError &&
      business.geocodingError.trim()
    ) {
      risks.push({
        id: "geocoding-failed",
        label: "Konum Hataları",
        severity: "medium",
        description: `Harita ayarlaması başarısız: ${business.geocodingError}`,
        actionable: true,
      });
      riskScore += 2;
    }

    // Stale geocoding
    if (
      "geocodingStatus" in business &&
      business.address &&
      !("geocodedAt" in business && business.geocodedAt)
    ) {
      risks.push({
        id: "stale-geocoding",
        label: "Eski Konum Verisi",
        severity: "low",
        description: "Harita konumu yenilenmesi önerilir.",
        actionable: true,
      });
      riskScore += 1;
    }

    // Inactive (90+ days)
    if (daysLastActive !== null && daysLastActive > 90) {
      risks.push({
        id: "inactive",
        label: "Hareketsiz",
        severity: "high",
        description: `Son ${daysLastActive} gün aktivite yok.`,
        actionable: false,
      });
      riskScore += 3;
    }

    // Dormant (30+ days on marketplace)
    if (
      business.status === "ACTIVE_MARKETPLACE" &&
      daysLastActive !== null &&
      daysLastActive > 30
    ) {
      risks.push({
        id: "dormant",
        label: "Az Aktivite",
        severity: "medium",
        description: `Son ${daysLastActive} gün pazar yerinde aktivite yok.`,
        actionable: false,
      });
      riskScore += 2;
    }

    // Pending reviews
    if ("pendingReviewCount" in business && business.pendingReviewCount > 0) {
      risks.push({
        id: "pending-reviews",
        label: `Beklemede ${business.pendingReviewCount} İnceleme`,
        severity: "low",
        description: "Onay bekleyen incelemeler var.",
        actionable: true,
      });
      riskScore += 1;
    }

    // Hidden media
    if ("hiddenMediaCount" in business && business.hiddenMediaCount > 0) {
      risks.push({
        id: "hidden-media",
        label: `${business.hiddenMediaCount} Gizli Medya`,
        severity: "low",
        description: "Gizlenmiş medya öğeleri incelenmeyi bekliyor.",
        actionable: false,
      });
      riskScore += 1;
    }
  }

  // Opportunity signals (all statuses)

  // High rating
  if (
    business.ratingStats &&
    business.ratingStats.bayesianScore !== null &&
    business.ratingStats.bayesianScore >= 8.0 &&
    business.ratingStats.rawReviewCount >= 5
  ) {
    opportunities.push({
      id: "high-rating",
      label: "Yüksek Puan",
      severity: "high",
      description: `${business.ratingStats.bayesianScore.toFixed(1)}/10 ile ${business.ratingStats.rawReviewCount} inceleme.`,
    });
  }

  // Complete profile
  if (completion.score === 100) {
    opportunities.push({
      id: "complete-profile",
      label: "Tam Profil",
      severity: "medium",
      description: "Tüm profil bölümleri tamamlandı.",
    });
  }

  // Active poster
  if ("posts" in business && business.posts.length > 0) {
    const recentPosts = business.posts.filter((p) => {
      const daysAgo = getDaysAgo(p.createdAt);
      return daysAgo !== null && daysAgo <= 30;
    });
    if (recentPosts.length > 0) {
      opportunities.push({
        id: "active-poster",
        label: "Aktif İçerik Üreticisi",
        severity: "medium",
        description: `Son 30 günde ${recentPosts.length} gönderi.`,
      });
    }
  }

  // Booking magnet
  if (
    daysLastActive !== null &&
    business._count.appointments > 0 &&
    daysLastActive <= 30
  ) {
    const appointmentsThisMonth = business._count.appointments;
    if (appointmentsThisMonth >= 10) {
      opportunities.push({
        id: "booking-magnet",
        label: "Rezervasyon Merkezi",
        severity: "medium",
        description: `Son 30 günde yüksek rezervasyon etkinliği.`,
      });
    }
  }

  return {
    risks,
    opportunities,
    riskScore: Math.min(riskScore, 10),
  };
}
