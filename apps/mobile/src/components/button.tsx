import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";

export interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: "primary" | "outline";
  loading?: boolean;
}

const PRIMARY_COLOR = "#3c87f7";

export function Button({ label, variant = "primary", loading, disabled, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.outline,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#ffffff" : PRIMARY_COLOR} />
      ) : (
        <ThemedText
          type="smallBold"
          style={variant === "primary" ? styles.primaryLabel : styles.outlineLabel}
        >
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
  },
  primary: {
    backgroundColor: PRIMARY_COLOR,
  },
  outline: {
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  primaryLabel: {
    color: "#ffffff",
  },
  outlineLabel: {
    color: PRIMARY_COLOR,
  },
});
