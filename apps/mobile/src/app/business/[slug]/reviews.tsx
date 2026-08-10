import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Page } from "@urglowup/api-client";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";
import { api } from "@/lib/api";
import type { BusinessReview } from "@/lib/types/review";

export default function BusinessReviewsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();

  const reviewsQuery = useInfiniteQuery({
    queryKey: ["business-reviews", slug],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      api.businesses.reviews(slug, pageParam) as Promise<Page<BusinessReview>>,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(slug),
  });

  const reviews = reviewsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Değerlendirmeler
        </ThemedText>

        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (reviewsQuery.hasNextPage && !reviewsQuery.isFetchingNextPage) {
              reviewsQuery.fetchNextPage();
            }
          }}
          renderItem={({ item }) => (
            <View style={[styles.reviewRow, { borderBottomColor: theme.backgroundSelected }]}>
              <View style={styles.reviewHeader}>
                <ThemedText type="smallBold">
                  {[item.customer.firstName, item.customer.lastName].filter(Boolean).join(" ") ||
                    "Müşteri"}
                </ThemedText>
                <ThemedText type="small">{item.rating}/10</ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {item.appointment.service.name}
              </ThemedText>
              {item.comment ? <ThemedText type="small">{item.comment}</ThemedText> : null}
            </View>
          )}
          ListEmptyComponent={
            !reviewsQuery.isLoading ? (
              <ThemedText type="small" style={styles.emptyText}>
                Henüz değerlendirme yok.
              </ThemedText>
            ) : null
          }
          ListFooterComponent={
            reviewsQuery.isLoading || reviewsQuery.isFetchingNextPage ? (
              <ActivityIndicator style={styles.spinner} />
            ) : null
          }
        />
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
  title: {
    fontSize: 28,
    lineHeight: 34,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: Spacing.three,
    paddingBottom: 40,
  },
  reviewRow: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spinner: {
    marginVertical: Spacing.three,
  },
  emptyText: {
    paddingTop: Spacing.two,
  },
});
