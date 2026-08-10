import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@urglowup/api-client";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth";
import { registerForPushNotifications } from "@/lib/push-notifications";
import type { Account, AccountPreferences } from "@/lib/types/account";

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [isRequestingPush, setIsRequestingPush] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const accountQuery = useQuery({
    queryKey: ["account", "me"],
    queryFn: () => api.account.me() as Promise<Account>,
  });
  const preferencesQuery = useQuery({
    queryKey: ["account", "preferences"],
    queryFn: () => api.account.preferences() as Promise<AccountPreferences>,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (patch: Partial<AccountPreferences>) => api.account.updatePreferences(patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["account", "preferences"] });
    },
  });

  const onTogglePreference = (key: keyof AccountPreferences, value: boolean) => {
    updatePreferencesMutation.mutate({ [key]: value });
  };

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

  const onDeleteAccount = () => {
    Alert.alert(
      "Hesabını sil",
      "Bu işlem geri alınamaz. Hesabın ve kişisel bilgilerin silinecek, gelecek randevuların iptal edilecek.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Hesabımı sil",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await api.account.deleteMe();
              await authClient.signOut();
            } catch {
              Alert.alert("Hata", "Hesap silinemedi. Lütfen tekrar deneyin.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const preferences = preferencesQuery.data;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Profil
          </ThemedText>

          <ThemedText type="smallBold" style={styles.sectionHeading}>
            Bilgilerin
          </ThemedText>
          {accountQuery.data ? (
            <ProfileEditForm account={accountQuery.data} />
          ) : (
            <ActivityIndicator style={styles.spinner} />
          )}

          <ThemedText type="smallBold" style={styles.sectionHeading}>
            Bildirim tercihleri
          </ThemedText>
          {preferences ? (
            <>
              <PreferenceRow
                label="E-posta ile randevu bildirimleri"
                value={preferences.emailTransactional}
                onChange={(v) => onTogglePreference("emailTransactional", v)}
              />
              <PreferenceRow
                label="WhatsApp ile randevu bildirimleri"
                value={preferences.whatsappTransactional}
                onChange={(v) => onTogglePreference("whatsappTransactional", v)}
              />
              <PreferenceRow
                label="E-posta ile kampanyalar"
                value={preferences.emailMarketing}
                onChange={(v) => onTogglePreference("emailMarketing", v)}
              />
              <PreferenceRow
                label="WhatsApp ile kampanyalar"
                value={preferences.whatsappMarketing}
                onChange={(v) => onTogglePreference("whatsappMarketing", v)}
              />
            </>
          ) : null}

          <ThemedText type="smallBold" style={styles.sectionHeading}>
            Diğer
          </ThemedText>
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

          <View style={[styles.dangerZone, { borderTopColor: theme.backgroundSelected }]}>
            <Button
              label={isDeleting ? "Siliniyor..." : "Hesabımı sil"}
              variant="outline"
              loading={isDeleting}
              onPress={onDeleteAccount}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// A separate component (rather than syncing accountQuery.data into the
// parent's state via useEffect) so the edit fields initialize from loaded
// data with a plain useState lazy initializer — no effect-driven setState,
// no cascading-render lint warning.
function ProfileEditForm({ account }: { account: Account }) {
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState(account.firstName ?? "");
  const [lastName, setLastName] = useState(account.lastName ?? "");
  const [phone, setPhone] = useState(account.phone ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: () => api.account.updateMe({ firstName, lastName, phone: phone || null }),
    onSuccess: async () => {
      setProfileError(null);
      setProfileSaved(true);
      await queryClient.invalidateQueries({ queryKey: ["account", "me"] });
    },
    onError: (err) => {
      setProfileSaved(false);
      setProfileError(err instanceof ApiError ? err.message : "Profil güncellenemedi.");
    },
  });

  return (
    <>
      <ThemedText type="small" themeColor="textSecondary">
        {account.email}
      </ThemedText>

      <TextField label="Ad" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
      <TextField label="Soyad" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
      <TextField
        label="Telefon"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+90 5XX XXX XX XX"
      />

      {profileError ? (
        <ThemedText type="small" style={styles.error}>
          {profileError}
        </ThemedText>
      ) : null}
      {profileSaved ? (
        <ThemedText type="small" themeColor="textSecondary">
          Kaydedildi.
        </ThemedText>
      ) : null}

      <Button
        label={updateProfileMutation.isPending ? "Kaydediliyor..." : "Bilgileri kaydet"}
        loading={updateProfileMutation.isPending}
        onPress={() => {
          setProfileSaved(false);
          updateProfileMutation.mutate();
        }}
      />
    </>
  );
}

function PreferenceRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.preferenceRow}>
      <ThemedText type="default" style={styles.preferenceLabel}>
        {label}
      </ThemedText>
      <Switch value={value} onValueChange={onChange} />
    </View>
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
    paddingBottom: 40,
    gap: Spacing.three,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  sectionHeading: {
    marginTop: Spacing.two,
  },
  spinner: {
    marginTop: Spacing.two,
  },
  error: {
    color: "#dc2626",
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  preferenceLabel: {
    flex: 1,
  },
  dangerZone: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
