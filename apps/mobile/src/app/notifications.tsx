import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Page } from "@urglowup/api-client";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";
import { api } from "@/lib/api";
import type { AppNotification } from "@/lib/types/notification";

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const notificationsQuery = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      api.notifications.list(pageParam) as Promise<Page<AppNotification>>,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const notifications = notificationsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  const onPressNotification = async (notification: AppNotification) => {
    if (!notification.readAt) {
      await api.notifications.markRead(notification.id);
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    if (notification.appointmentId) {
      router.push(`/appointments/${notification.appointmentId}`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Bildirimler
        </ThemedText>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (notificationsQuery.hasNextPage && !notificationsQuery.isFetchingNextPage) {
              notificationsQuery.fetchNextPage();
            }
          }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPressNotification(item)}
              style={[
                styles.card,
                {
                  backgroundColor: item.readAt ? theme.background : theme.backgroundElement,
                },
              ]}
            >
              <ThemedText type="smallBold">{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.body}
              </ThemedText>
            </Pressable>
          )}
          ListEmptyComponent={
            !notificationsQuery.isLoading ? (
              <ThemedText type="small" style={styles.emptyText}>
                Henüz bildirimin yok.
              </ThemedText>
            ) : null
          }
          ListFooterComponent={
            notificationsQuery.isLoading || notificationsQuery.isFetchingNextPage ? (
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
    gap: Spacing.two,
  },
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: 2,
    marginBottom: Spacing.two,
  },
  spinner: {
    marginVertical: Spacing.three,
  },
  emptyText: {
    paddingHorizontal: 0,
  },
});
