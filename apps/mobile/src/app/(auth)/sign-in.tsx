import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signInSchema, type SignInBody } from "@urglowup/validation";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/button";
import { Spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth";

export default function SignInScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInBody>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInBody) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });
      if (error) {
        setFormError(mapSignInError(error.code, error.message));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGoogleSignIn = async () => {
    setFormError(null);
    setIsGoogleSubmitting(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
      if (error) {
        setFormError("Google ile giriş şu anda başlatılamıyor. Lütfen e-posta ile giriş yapın.");
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <ThemedText type="title" style={styles.title}>
              UrGlowUp
            </ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>
              Giriş yap
            </ThemedText>

            {formError ? (
              <ThemedText type="small" style={styles.error}>
                {formError}
              </ThemedText>
            ) : null}

            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <TextField
                  label="E-posta"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <TextField
                  label="Şifre"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="current-password"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Button
              label={isSubmitting ? "Giriş yapılıyor..." : "Giriş yap"}
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />

            <Button
              label={isGoogleSubmitting ? "Google'a yönlendiriliyor..." : "Google ile devam et"}
              variant="outline"
              loading={isGoogleSubmitting}
              onPress={onGoogleSignIn}
            />

            <Link href="/(auth)/sign-up" style={styles.linkRow}>
              <ThemedText type="link" themeColor="textSecondary">
                Hesabın yok mu? <ThemedText type="linkPrimary">Kayıt ol</ThemedText>
              </ThemedText>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function mapSignInError(code: string | undefined, message: string | undefined): string {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "E-posta adresi veya şifre hatalı.";
    case "EMAIL_NOT_VERIFIED":
      return "E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzu kontrol edin.";
    case "TOO_MANY_REQUESTS":
      return "Çok fazla istek alındı. Lütfen birkaç dakika sonra tekrar deneyin.";
    default:
      return message ?? "Giriş yapılamadı. Bilgilerinizi kontrol edip tekrar deneyin.";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: Spacing.three,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 26,
    marginBottom: Spacing.two,
  },
  error: {
    color: "#dc2626",
  },
  linkRow: {
    alignSelf: "center",
    marginTop: Spacing.two,
  },
});
