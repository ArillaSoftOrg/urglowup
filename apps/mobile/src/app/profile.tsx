import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/button";
import { Spacing } from "@/constants/theme";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth";
import { registerForPushNotifications } from "@/lib/push-notifications";

interface AccountMe {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

// Minimal placeholder for Phase 8 item 14 (Profile/settings — edit profile,
// language, notification prefs, delete account). For now this only exposes
// the things every other screen depends on existing somewhere: sign out and
// push notification opt-in.
export default function ProfileScreen() {
  const router = useRouter();
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [isRequestingPush, setIsRequestingPush] = useState(false);

  const { data } = useQuery({
    queryKey: ["account", "me"],
    queryFn: () => api.account.me(),
  });
  const account = data as AccountMe | undefined;

  const onEnablePush = async () => {
    setIsRequestingPush(true);
    setPushStatus(null);
    try {
      const result = await registerForPushNotifications();
      setPushStatus(result.ok ? "Bildirimler açıldı." : result.message);
    } finally {
      setIsRequestingPush(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Profil
          </ThemedText>

          {account ? (
            <ThemedText type="default">
              {[account.firstName, account.lastName].filter(Boolean).join(" ") || account.email}
            </ThemedText>
          ) : null}
          {account ? (
            <ThemedText type="small" themeColor="textSecondary">
              {account.email}
            </ThemedText>
          ) : null}

          <Button label="Bildirimler" variant="outline" onPress={() => router.push("/notifications")} />

          <Button
            label={isRequestingPush ? "İsteniyor..." : "Anlık bildirimleri aç"}
            variant="outline"
            loading={isRequestingPush}
            onPress={onEnablePush}
          />
          {pushStatus ? (
            <ThemedText type="small" themeColor="textSecondary">
              {pushStatus}
            </ThemedText>
          ) : null}

          <Button label="Çıkış yap" variant="outline" onPress={() => authClient.signOut()} />
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: Spacing.three,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
});
