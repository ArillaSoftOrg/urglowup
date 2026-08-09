import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signUpSchema, type SignUpBody } from "@urglowup/validation";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/button";
import { Spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth";

export default function SignUpScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpBody>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", passwordConfirm: "" },
  });

  const onSubmit = async (values: SignUpBody) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const { error } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      if (error) {
        setFormError(mapSignUpError(error.code, error.message));
      }
    } finally {
      setIsSubmitting(false);
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
              Hesap oluştur
            </ThemedText>

            {formError ? (
              <ThemedText type="small" style={styles.error}>
                {formError}
              </ThemedText>
            ) : null}

            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <TextField
                  label="Ad soyad"
                  autoCapitalize="words"
                  autoComplete="name"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.name?.message}
                />
              )}
            />

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
                  autoComplete="new-password"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="passwordConfirm"
              render={({ field }) => (
                <TextField
                  label="Şifre tekrar"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.passwordConfirm?.message}
                />
              )}
            />

            <Button
              label={isSubmitting ? "Hesap oluşturuluyor..." : "Hesap oluştur"}
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />

            <Link href="/(auth)/sign-in" style={styles.linkRow}>
              <ThemedText type="link" themeColor="textSecondary">
                Zaten hesabın var mı? <ThemedText type="linkPrimary">Giriş yap</ThemedText>
              </ThemedText>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function mapSignUpError(code: string | undefined, message: string | undefined): string {
  switch (code) {
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Bu e-posta adresiyle kayıtlı bir hesap zaten var.";
    case "PASSWORD_TOO_SHORT":
      return "Şifre en az 8 karakter olmalı.";
    case "PASSWORD_TOO_WEAK":
      return "Güçlü bir şifre oluşturun. En az 8 karakter, büyük/küçük harf, rakam ve özel karakter içermeli.";
    default:
      return message ?? "Hesap oluşturulamadı. Lütfen tekrar deneyin.";
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
