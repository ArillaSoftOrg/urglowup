import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/button";
import { Spacing } from "@/constants/theme";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth";

interface AccountMe {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

// Minimal placeholder for Phase 8 item 14 (Profile/settings — edit profile,
// language, notification prefs, delete account). For now this only exposes
// the one thing every other screen depends on existing somewhere: sign out.
export default function ProfileScreen() {
  const { data } = useQuery({
    queryKey: ["account", "me"],
    queryFn: () => api.account.me(),
  });
  const account = data as AccountMe | undefined;

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
