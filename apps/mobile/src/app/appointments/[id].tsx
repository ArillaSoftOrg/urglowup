import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@urglowup/api-client";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { api } from "@/lib/api";
import { CUSTOMER_CANCELLABLE_STATUSES, STATUS_LABEL, type Appointment } from "@/lib/types/appointment";

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
    days.push({ value: toDateString(d), label: String(d.getDate()), weekday: WEEKDAY_LABEL[d.getDay()] });
  }
  return days;
}

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const dates = useMemo(() => nextDays(14), []);

  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dates[0].value);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const appointmentQuery = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => api.appointments.byId(id),
    enabled: Boolean(id),
  });
  const appointment = appointmentQuery.data as Appointment | undefined;

  const availabilityQuery = useQuery({
    queryKey: ["availability", appointment?.business.slug, appointment?.service.id, selectedDate],
    queryFn: () =>
      api.businesses.availability(appointment!.business.slug, appointment!.service.id, selectedDate),
    enabled: isRescheduling && Boolean(appointment),
  });
  const slots = availabilityQuery.data?.slots ?? [];

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["appointment", id] }),
      queryClient.invalidateQueries({ queryKey: ["appointments"] }),
    ]);
  };

  const onCancel = async () => {
    setActionError(null);
    setIsCancelling(true);
    try {
      await api.appointments.cancel(id);
      await invalidate();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "İptal edilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsCancelling(false);
    }
  };

  const onSubmitReschedule = async () => {
    if (!selectedTime) return;
    setActionError(null);
    setIsSubmittingReschedule(true);
    try {
      await api.appointments.reschedule(id, { date: selectedDate, time: selectedTime });
      setIsRescheduling(false);
      setSelectedTime(null);
      await invalidate();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Yeniden planlanamadı. Lütfen tekrar deneyin.",
      );
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const onSubmitReview = async () => {
    setActionError(null);
    setIsSubmittingReview(true);
    try {
      await api.appointments.review(id, { rating: reviewStars * 2, comment: reviewComment || null });
      setReviewSubmitted(true);
      await invalidate();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Değerlendirme gönderilemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (appointmentQuery.isLoading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!appointment) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ThemedText type="default">Randevu bulunamadı.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const canModify = CUSTOMER_CANCELLABLE_STATUSES.includes(appointment.status);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="subtitle" style={styles.title}>
            {appointment.business.name}
          </ThemedText>
          <ThemedText type="smallBold" style={styles.statusBadge}>
            {STATUS_LABEL[appointment.status]}
          </ThemedText>

          <View style={styles.detailRow}>
            <ThemedText type="default">{appointment.service.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {appointment.requestedDate} · {appointment.requestedTime}
              {appointment.totalDurationMinutes ? ` · ${appointment.totalDurationMinutes} dk` : ""}
            </ThemedText>
            {appointment.business.address ? (
              <ThemedText type="small" themeColor="textSecondary">
                {appointment.business.address}
              </ThemedText>
            ) : null}
            {appointment.customerNote ? (
              <ThemedText type="small" themeColor="textSecondary">
                Not: {appointment.customerNote}
              </ThemedText>
            ) : null}
            {appointment.cancelledReason ? (
              <ThemedText type="small" themeColor="textSecondary">
                İptal nedeni: {appointment.cancelledReason}
              </ThemedText>
            ) : null}
          </View>

          {actionError ? (
            <ThemedText type="small" style={styles.error}>
              {actionError}
            </ThemedText>
          ) : null}

          {canModify ? (
            <View style={styles.actions}>
              <Button
                label={isRescheduling ? "Yeniden planlamayı kapat" : "Yeniden planla"}
                variant="outline"
                onPress={() => setIsRescheduling((v) => !v)}
              />
              <Button
                label={isCancelling ? "İptal ediliyor..." : "İptal et"}
                variant="outline"
                loading={isCancelling}
                onPress={onCancel}
              />
            </View>
          ) : null}

          {isRescheduling ? (
            <View style={styles.rescheduleBlock}>
              <ThemedText type="smallBold" style={styles.sectionHeading}>
                Yeni tarih
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

              <ThemedText type="smallBold" style={styles.sectionHeading}>
                Yeni saat
              </ThemedText>
              {availabilityQuery.isLoading ? <ActivityIndicator style={styles.spinner} /> : null}
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

              <Button
                label={isSubmittingReschedule ? "Kaydediliyor..." : "Yeni tarihi onayla"}
                loading={isSubmittingReschedule}
                disabled={!selectedTime}
                onPress={onSubmitReschedule}
              />
            </View>
          ) : null}

          {appointment.status === "COMPLETED" && !appointment.review && !reviewSubmitted ? (
            <View style={styles.reviewBlock}>
              <ThemedText type="smallBold" style={styles.sectionHeading}>
                Deneyimini değerlendir
              </ThemedText>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setReviewStars(star)}>
                    <ThemedText type="title" style={star <= reviewStars ? styles.starActive : styles.starInactive}>
                      ★
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              <TextInput
                placeholder="Yorumun (opsiyonel)"
                placeholderTextColor={theme.textSecondary}
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                style={[
                  styles.reviewInput,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
              />
              <Button
                label={isSubmittingReview ? "Gönderiliyor..." : "Değerlendirmeyi gönder"}
                loading={isSubmittingReview}
                onPress={onSubmitReview}
              />
            </View>
          ) : null}

          {appointment.review || reviewSubmitted ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.reviewBlock}>
              Bu randevu için değerlendirme gönderildi.
            </ThemedText>
          ) : null}
        </ScrollView>
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
    paddingBottom: 40,
    gap: Spacing.two,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
  statusBadge: {
    color: "#3c87f7",
  },
  detailRow: {
    marginTop: Spacing.two,
    gap: 2,
  },
  error: {
    color: "#dc2626",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  rescheduleBlock: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  reviewBlock: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  starRow: {
    flexDirection: "row",
    gap: Spacing.one,
  },
  starActive: {
    color: "#f59e0b",
    fontSize: 28,
    lineHeight: 32,
  },
  starInactive: {
    color: "#d4d4d8",
    fontSize: 28,
    lineHeight: 32,
  },
  reviewInput: {
    borderRadius: 10,
    padding: Spacing.three,
    minHeight: 80,
    textAlignVertical: "top",
  },
  sectionHeading: {
    marginTop: Spacing.two,
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
});
