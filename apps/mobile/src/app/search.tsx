import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TextField } from "@/components/text-field";
import { BusinessCard } from "@/components/business-card";
import { Spacing } from "@/constants/theme";
import { api } from "@/lib/api";
import type { BusinessSummary } from "@/lib/types/marketplace";

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState("");

  const businessesQuery = useQuery({
    queryKey: ["businesses", "search", query, params.category ?? null],
    queryFn: () =>
      api.businesses.search({
        q: query || undefined,
        category: params.category,
        limit: 50,
      }),
  });

  const businesses = (businessesQuery.data?.data as BusinessSummary[] | undefined) ?? [];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TextField
            label="Ara"
            placeholder="İşletme, hizmet, şehir ara..."
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {params.category ? (
            <ThemedText type="small" themeColor="textSecondary">
              Kategori: {params.category}
            </ThemedText>
          ) : null}
        </View>

        {businessesQuery.isLoading ? <ActivityIndicator style={styles.spinner} /> : null}
        {businessesQuery.error ? (
          <ThemedText type="small" style={styles.error}>
            Bir şeyler ters gitti:{" "}
            {businessesQuery.error instanceof Error ? businessesQuery.error.message : "bilinmeyen hata"}
          </ThemedText>
        ) : null}

        <FlatList
          data={businesses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <BusinessCard business={item} onPress={() => router.push(`/business/${item.slug}`)} />
            </View>
          )}
          ListEmptyComponent={
            !businessesQuery.isLoading ? (
              <ThemedText type="small" style={styles.emptyText}>
                Sonuç bulunamadı.
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: Spacing.one,
  },
  spinner: {
    marginTop: Spacing.three,
  },
  error: {
    color: "#dc2626",
    paddingHorizontal: 20,
    marginTop: Spacing.two,
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
