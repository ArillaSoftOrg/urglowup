import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { BusinessSummary } from "@/lib/types/marketplace";

export interface BusinessCardProps {
  business: BusinessSummary;
  onPress: () => void;
}

export function BusinessCard({ business, onPress }: BusinessCardProps) {
  const theme = useTheme();
  const location = [business.district, business.city].filter(Boolean).join(", ");
  const categoryNames = business.categories.map((c) => c.category.name).slice(0, 2).join(" · ");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}
    >
      {business.coverImageUrl ? (
        <Image source={{ uri: business.coverImageUrl }} style={styles.cover} contentFit="cover" />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder, { backgroundColor: theme.backgroundSelected }]} />
      )}

      <View style={styles.body}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {business.name}
        </ThemedText>
        {location ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {location}
          </ThemedText>
        ) : null}
        {categoryNames ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {categoryNames}
          </ThemedText>
        ) : null}

        <View style={styles.footerRow}>
          {business.reviewCount > 0 && business.reviewAvg !== null ? (
            <ThemedText type="small" style={styles.rating}>
              {(Math.round(business.reviewAvg * 10) / 10).toFixed(1)}/10 ({business.reviewCount})
            </ThemedText>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              Henüz değerlendirme yok
            </ThemedText>
          )}
          {business.startingPrice ? (
            <ThemedText type="small" themeColor="textSecondary">
              {business.startingPrice}₺&apos;den başlayan
            </ThemedText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.85,
  },
  cover: {
    width: "100%",
    height: 140,
  },
  coverPlaceholder: {},
  body: {
    padding: Spacing.three,
    gap: 2,
  },
  footerRow: {
    marginTop: Spacing.one,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rating: {
    color: "#b45309",
  },
});
