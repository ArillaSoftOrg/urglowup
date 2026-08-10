import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { api } from "@/lib/api";
import { STATUS_LABEL, type Appointment } from "@/lib/types/appointment";

export default function AppointmentsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: () => api.appointments.list(),
  });

  const appointments = (appointmentsQuery.data?.data as Appointment[] | undefined) ?? [];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Randevularım
        </ThemedText>

        {appointmentsQuery.isLoading ? <ActivityIndicator style={styles.spinner} /> : null}
        {appointmentsQuery.error ? (
          <ThemedText type="small" style={styles.error}>
            Bir şeyler ters gitti.
          </ThemedText>
        ) : null}

        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/appointments/${item.id}`)}
              style={[styles.card, { backgroundColor: theme.backgroundElement }]}
            >
              <View style={styles.cardHeader}>
                <ThemedText type="smallBold" numberOfLines={1} style={styles.businessName}>
                  {item.business.name}
                </ThemedText>
                <ThemedText type="small" style={styles.status}>
                  {STATUS_LABEL[item.status]}
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {item.service.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.requestedDate} · {item.requestedTime}
              </ThemedText>
            </Pressable>
          )}
          ListEmptyComponent={
            !appointmentsQuery.isLoading ? (
              <ThemedText type="small" style={styles.emptyText}>
                Henüz randevun yok.
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
  error: {
    color: "#dc2626",
    paddingHorizontal: 20,
    marginTop: Spacing.two,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: Spacing.three,
    paddingBottom: 40,
    gap: Spacing.two,
  },
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: 2,
    marginBottom: Spacing.two,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.two,
  },
  businessName: {
    flex: 1,
  },
  status: {
    color: "#3c87f7",
  },
  emptyText: {
    paddingHorizontal: 20,
  },
});
