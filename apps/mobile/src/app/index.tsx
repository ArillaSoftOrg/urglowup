import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/button";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth";

interface Category {
  id: string;
  name: string;
  slug: string;
  businessCount: number;
}

export default function HomeScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.list(),
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          UrGlowUp
        </ThemedText>

        {isLoading && <ActivityIndicator />}
        {error && (
          <ThemedText type="small" style={styles.error}>
            Could not load categories: {error instanceof Error ? error.message : "unknown error"}
          </ThemedText>
        )}

        <FlatList
          style={styles.list}
          data={(data?.data as Category[] | undefined) ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ThemedView style={styles.row}>
              <ThemedText type="default">{item.name}</ThemedText>
              <ThemedText type="small">{item.businessCount}</ThemedText>
            </ThemedView>
          )}
          ListEmptyComponent={
            !isLoading && !error ? <ThemedText type="small">No categories yet.</ThemedText> : null
          }
        />

        <Button
          label="Çıkış yap"
          variant="outline"
          onPress={() => authClient.signOut()}
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
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  title: {
    textAlign: "center",
  },
  error: {
    color: "#dc2626",
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#00000022",
  },
});
