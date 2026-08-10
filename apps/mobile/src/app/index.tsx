import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BusinessCard } from "@/components/business-card";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { api } from "@/lib/api";
import type { BusinessSummary, Category } from "@/lib/types/marketplace";

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.list(),
  });

  const businessesQuery = useQuery({
    queryKey: ["businesses", "recommended"],
    queryFn: () => api.businesses.search({ sort: "recommended", limit: 20 }),
  });

  const categories = (categoriesQuery.data?.data as Category[] | undefined) ?? [];
  const businesses = (businessesQuery.data?.data as BusinessSummary[] | undefined) ?? [];
  const isLoading = categoriesQuery.isLoading || businessesQuery.isLoading;
  const error = categoriesQuery.error ?? businessesQuery.error;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={businesses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                UrGlowUp
              </ThemedText>
              <View style={styles.headerActions}>
                <Pressable onPress={() => router.push("/search")}>
                  <ThemedText type="linkPrimary">Ara</ThemedText>
                </Pressable>
                <Pressable onPress={() => router.push("/appointments")}>
                  <ThemedText type="linkPrimary">Randevular</ThemedText>
                </Pressable>
                <Pressable onPress={() => router.push("/favorites")}>
                  <ThemedText type="linkPrimary">Favoriler</ThemedText>
                </Pressable>
                <Pressable onPress={() => router.push("/profile")}>
                  <ThemedText type="linkPrimary">Profil</ThemedText>
                </Pressable>
              </View>

              {error ? (
                <ThemedText type="small" style={styles.error}>
                  Bir şeyler ters gitti: {error instanceof Error ? error.message : "bilinmeyen hata"}
                </ThemedText>
              ) : null}

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categories}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.categoryStrip}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => router.push({ pathname: "/search", params: { category: item.slug } })}
                    style={[styles.categoryChip, { backgroundColor: theme.backgroundElement }]}
                  >
                    <ThemedText type="small">{item.name}</ThemedText>
                  </Pressable>
                )}
              />

              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Senin için önerilenler
              </ThemedText>

              {isLoading && !businesses.length ? <ActivityIndicator style={styles.spinner} /> : null}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <BusinessCard business={item} onPress={() => router.push(`/business/${item.slug}`)} />
            </View>
          )}
          ListEmptyComponent={
            !isLoading && !error ? (
              <ThemedText type="small" style={styles.emptyText}>
                Henüz önerilecek işletme yok.
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
  listContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: Spacing.three,
  },
  headerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  error: {
    color: "#dc2626",
  },
  categoryStrip: {
    gap: Spacing.two,
  },
  categoryChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  spinner: {
    marginVertical: Spacing.three,
  },
  cardWrapper: {
    paddingHorizontal: 20,
    marginBottom: Spacing.three,
  },
  emptyText: {
    paddingHorizontal: 20,
  },
});
