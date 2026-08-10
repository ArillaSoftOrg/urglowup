import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { api } from "@/lib/api";
import type { BusinessDetail, BusinessDetailService } from "@/lib/types/business-detail";
import type { BusinessSummary } from "@/lib/types/marketplace";

const DAY_LABEL: Record<string, string> = {
  MONDAY: "Pazartesi",
  TUESDAY: "Salı",
  WEDNESDAY: "Çarşamba",
  THURSDAY: "Perşembe",
  FRIDAY: "Cuma",
  SATURDAY: "Cumartesi",
  SUNDAY: "Pazar",
};

function formatServicePrice(service: BusinessDetailService): string | null {
  if (service.priceType === "FREE_CONSULTATION") return "Ücretsiz danışma";
  if (service.priceType === "CONSULTATION_REQUIRED") return "Fiyat için danışın";
  if (!service.price) return null;
  const amount = `₺${Number(service.price)}`;
  return service.priceType === "STARTS_FROM" ? `${amount} itibaren` : amount;
}

export default function BusinessDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["business", slug],
    queryFn: () => api.businesses.bySlug(slug),
    enabled: Boolean(slug),
  });

  const favoritesQuery = useQuery({
    queryKey: ["favorites"],
    queryFn: () => api.favorites.list(),
  });

  const business = detailQuery.data as BusinessDetail | undefined;
  const favorites = (favoritesQuery.data?.data as BusinessSummary[] | undefined) ?? [];
  const isFavorited = business ? favorites.some((f) => f.id === business.id) : false;

  const onToggleFavorite = async () => {
    if (!business) return;
    setIsTogglingFavorite(true);
    try {
      if (isFavorited) {
        await api.favorites.remove(business.id);
      } else {
        await api.favorites.add(business.id);
      }
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (detailQuery.isLoading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (detailQuery.error || !business) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ThemedText type="default">İşletme bulunamadı.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const location = [business.district, business.city].filter(Boolean).join(", ");

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {business.coverImageUrl ? (
            <Image source={{ uri: business.coverImageUrl }} style={styles.cover} contentFit="cover" />
          ) : null}

          <View style={styles.section}>
            <View style={styles.headerRow}>
              <ThemedText type="subtitle" style={styles.name}>
                {business.name}
              </ThemedText>
              <Pressable onPress={onToggleFavorite} disabled={isTogglingFavorite}>
                <ThemedText type="linkPrimary">{isFavorited ? "♥ Favoride" : "♡ Favorile"}</ThemedText>
              </Pressable>
            </View>

            {location ? (
              <ThemedText type="small" themeColor="textSecondary">
                {location}
              </ThemedText>
            ) : null}

            <ThemedText type="small" themeColor="textSecondary">
              {business._count.reviews} değerlendirme · {business._count.appointments} randevu
            </ThemedText>

            {business.description ? (
              <ThemedText type="default" style={styles.description}>
                {business.description}
              </ThemedText>
            ) : null}
          </View>

          {business.services.length > 0 ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionHeading}>
                Hizmetler
              </ThemedText>
              {business.services.map((service) => (
                <View
                  key={service.id}
                  style={[styles.serviceRow, { borderBottomColor: theme.backgroundSelected }]}
                >
                  <View style={styles.serviceInfo}>
                    <ThemedText type="default">{service.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {service.durationMinutes} dk
                    </ThemedText>
                  </View>
                  {formatServicePrice(service) ? (
                    <ThemedText type="smallBold">{formatServicePrice(service)}</ThemedText>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {business.professionals.length > 0 ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionHeading}>
                Uzmanlar
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {business.professionals.map((pro) => (
                  <View key={pro.id} style={styles.proCard}>
                    {pro.avatarUrl ? (
                      <Image source={{ uri: pro.avatarUrl }} style={styles.proAvatar} contentFit="cover" />
                    ) : (
                      <View style={[styles.proAvatar, { backgroundColor: theme.backgroundElement }]} />
                    )}
                    <ThemedText type="small" numberOfLines={1} style={styles.proName}>
                      {pro.displayName}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {business.hours.length > 0 ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionHeading}>
                Çalışma saatleri
              </ThemedText>
              {business.hours.map((hour) => (
                <View key={hour.dayOfWeek} style={styles.hourRow}>
                  <ThemedText type="small">{DAY_LABEL[hour.dayOfWeek] ?? hour.dayOfWeek}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {hour.isOpen && hour.openTime && hour.closeTime
                      ? `${hour.openTime} - ${hour.closeTime}`
                      : "Kapalı"}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : null}

          {business.reviews.length > 0 ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionHeading}>
                Değerlendirmeler
              </ThemedText>
              {business.reviews.slice(0, 5).map((review) => (
                <View
                  key={review.id}
                  style={[styles.reviewRow, { borderBottomColor: theme.backgroundSelected }]}
                >
                  <View style={styles.headerRow}>
                    <ThemedText type="smallBold">
                      {[review.customer.firstName, review.customer.lastName].filter(Boolean).join(" ") ||
                        "Müşteri"}
                    </ThemedText>
                    <ThemedText type="small">{review.rating}/5</ThemedText>
                  </View>
                  {review.comment ? <ThemedText type="small">{review.comment}</ThemedText> : null}
                </View>
              ))}
              <Link href={{ pathname: "/business/[slug]/reviews", params: { slug: business.slug } }}>
                <ThemedText type="linkPrimary">Tüm değerlendirmeleri gör</ThemedText>
              </Link>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.backgroundSelected }]}>
          <Button label="Randevu al" onPress={() => router.push(`/business/${business.slug}/book`)} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingBottom: 20,
  },
  cover: {
    width: "100%",
    height: 220,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: Spacing.four,
    gap: Spacing.one,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  name: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
  },
  description: {
    marginTop: Spacing.two,
  },
  sectionHeading: {
    marginBottom: Spacing.two,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  serviceInfo: {
    gap: 2,
  },
  proCard: {
    width: 84,
    marginRight: Spacing.two,
    alignItems: "center",
    gap: Spacing.one,
  },
  proAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  proName: {
    textAlign: "center",
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  reviewRow: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
