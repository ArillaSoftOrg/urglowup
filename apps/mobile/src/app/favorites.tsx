import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BusinessCard } from "@/components/business-card";
import { Spacing } from "@/constants/theme";
import { api } from "@/lib/api";
import type { BusinessSummary } from "@/lib/types/marketplace";

export default function FavoritesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: ["favorites"],
    queryFn: () => api.favorites.list(),
  });

  const favorites = (favoritesQuery.data?.data as BusinessSummary[] | undefined) ?? [];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Favorilerim
        </ThemedText>

        {favoritesQuery.isLoading ? <ActivityIndicator style={styles.spinner} /> : null}

        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ["favorites"] })}
          refreshing={favoritesQuery.isFetching}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <BusinessCard business={item} onPress={() => router.push(`/business/${item.slug}`)} />
            </View>
          )}
          ListEmptyComponent={
            !favoritesQuery.isLoading ? (
              <ThemedText type="small" style={styles.emptyText}>
                Henüz favori işletmen yok.
              </ThemedText>
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
  spinner: {
    marginTop: Spacing.three,
  },
  listContent: {
    paddingTop: Spacing.three,
    paddingBottom: 40,
  },
  cardWrapper: {
    paddingHorizontal: 20,
    marginBottom: Spacing.three,
  },
  emptyText: {
    paddingHorizontal: 20,
  },
});
