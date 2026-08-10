import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "@/lib/api";

export type PushRegistrationResult =
  | { ok: true }
  | { ok: false; reason: "PERMISSION_DENIED" | "NOT_A_DEVICE" | "NO_PROJECT_ID" | "UNKNOWN"; message: string };

/**
 * Requests notification permission and registers the device's Expo push
 * token with the backend (POST /api/v1/devices). Requires a real EAS
 * project id (app.json's extra.eas.projectId) to call getExpoPushTokenAsync
 * — that doesn't exist yet (no EAS project has been created for this app,
 * same external-setup gap as the Apple/Google store accounts flagged for
 * Phase 12). Until `eas init` is run, this fails closed with NO_PROJECT_ID
 * rather than silently no-op'ing, so the gap is visible instead of hidden.
 */
export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return { ok: false, reason: "NOT_A_DEVICE", message: "Bildirimler yalnızca gerçek cihazlarda çalışır." };
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") {
    return { ok: false, reason: "PERMISSION_DENIED", message: "Bildirim izni verilmedi." };
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) {
    return {
      ok: false,
      reason: "NO_PROJECT_ID",
      message: "Bildirimler henüz yapılandırılmadı (EAS projesi eksik).",
    };
  }

  try {
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.devices.register({
      expoPushToken,
      platform: Platform.OS === "ios" ? "ios" : "android",
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "UNKNOWN", message: "Bildirim kaydı başarısız oldu." };
  }
}
