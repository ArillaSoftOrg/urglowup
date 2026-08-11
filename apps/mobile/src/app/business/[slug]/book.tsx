import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { api } from "@/lib/api";
import { ApiError } from "@urglowup/api-client";

const WEEKDAY_LABEL = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function nextDays(count: number): { value: string; label: string; weekday: string }[] {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push({
      value: toDateString(d),
      label: String(d.getDate()),
      weekday: WEEKDAY_LABEL[d.getDay()],
    });
  }
  return days;
}

export default function BookingScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const dates = useMemo(() => nextDays(14), []);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(dates[0].value);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => Crypto.randomUUID());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["business", slug],
    queryFn: () => api.businesses.bySlug(slug),
    enabled: Boolean(slug),
  });
  const business = detailQuery.data;
  const activeServices = (business?.services ?? []).filter((s) => s.isActive);

  const availabilityQuery = useQuery({
    queryKey: ["availability", slug, selectedServiceId, selectedDate],
    queryFn: () => api.businesses.availability(slug, selectedServiceId as string, selectedDate),
    enabled: Boolean(slug) && Boolean(selectedServiceId),
  });
  const slots = availabilityQuery.data?.slots ?? [];

  const canConfirm = Boolean(business && selectedServiceId && selectedTime);

  const onConfirm = async () => {
    if (!business || !selectedServiceId || !selectedTime) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await api.appointments.create(
        {
          businessId: business.id,
          serviceId: selectedServiceId,
          date: selectedDate,
          time: selectedTime,
        },
        idempotencyKey,
      );
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      router.replace(`/appointments/${result.appointmentId}`);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Randevu oluşturulamadı. Lütfen tekrar deneyin.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (detailQuery.isLoading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!business) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ThemedText type="default">İşletme bulunamadı.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="subtitle" style={styles.title}>
            {business.name}
          </ThemedText>

          <ThemedText type="smallBold" style={styles.sectionHeading}>
            Hizmet seç
          </ThemedText>
          <View style={styles.serviceList}>
            {activeServices.map((service) => (
              <Pressable
                key={service.id}
                onPress={() => {
                  setSelectedServiceId(service.id);
                  setSelectedTime(null);
                }}
                style={[
                  styles.serviceOption,
                  {
                    backgroundColor:
                      selectedServiceId === service.id ? theme.backgroundSelected : theme.backgroundElement,
                  },
                ]}
              >
                <ThemedText type="default">{service.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {service.durationMinutes} dk
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText type="smallBold" style={styles.sectionHeading}>
            Tarih seç
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
            {dates.map((day) => (
              <Pressable
                key={day.value}
                onPress={() => {
                  setSelectedDate(day.value);
                  setSelectedTime(null);
                }}
                style={[
                  styles.dateChip,
                  {
                    backgroundColor:
                      selectedDate === day.value ? theme.backgroundSelected : theme.backgroundElement,
                  },
                ]}
              >
                <ThemedText type="small">{day.weekday}</ThemedText>
                <ThemedText type="smallBold">{day.label}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          {selectedServiceId ? (
            <>
              <ThemedText type="smallBold" style={styles.sectionHeading}>
                Saat seç
              </ThemedText>
              {availabilityQuery.isLoading ? <ActivityIndicator style={styles.spinner} /> : null}
              {!availabilityQuery.isLoading && slots.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Bu tarihte uygun saat yok.
                </ThemedText>
              ) : null}
              <View style={styles.slotGrid}>
                {slots.map((slot) => (
                  <Pressable
                    key={slot}
                    onPress={() => setSelectedTime(slot)}
                    style={[
                      styles.slotChip,
                      {
                        backgroundColor:
                          selectedTime === slot ? theme.backgroundSelected : theme.backgroundElement,
                      },
                    ]}
                  >
                    <ThemedText type="small">{slot}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {submitError ? (
            <ThemedText type="small" style={styles.error}>
              {submitError}
            </ThemedText>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.backgroundSelected }]}>
          <Button
            label={isSubmitting ? "Randevu oluşturuluyor..." : "Randevuyu onayla"}
            loading={isSubmitting}
            disabled={!canConfirm}
            onPress={onConfirm}
          />
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: Spacing.two,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: Spacing.two,
  },
  sectionHeading: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  serviceList: {
    gap: Spacing.two,
  },
  serviceOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: 10,
  },
  dateStrip: {
    gap: Spacing.two,
  },
  dateChip: {
    alignItems: "center",
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 52,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  slotChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 10,
  },
  spinner: {
    marginVertical: Spacing.two,
  },
  error: {
    color: "#dc2626",
    marginTop: Spacing.two,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
