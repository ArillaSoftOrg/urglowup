"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { logMfaEvent } from "@/app/(admin-mfa)/admin/mfa/actions";
import { PasswordInput } from "@/components/shared/password-input";

type Step = "password" | "qr" | "verify";

interface SetupState {
  step: Step;
  password: string;
  totpURI?: string;
  backupCodes?: string[];
  totpCode: string;
  error?: string;
  loading: boolean;
}

export function MfaSetupFlow() {
  const router = useRouter();
  const [state, setState] = useState<SetupState>({
    step: "password",
    password: "",
    totpCode: "",
    loading: false,
  });
  const [codeSaved, setCodeSaved] = useState(false);

  async function handlePasswordSubmit() {
    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const enableResult = await authClient.twoFactor.enable({
        password: state.password,
      });

      if (enableResult.error) {
        setState((prev) => ({
          ...prev,
          error: enableResult.error.message || "Failed to start MFA setup",
          loading: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        step: "qr",
        totpURI: enableResult.data?.totpURI,
        backupCodes: enableResult.data?.backupCodes || [],
        loading: false,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        error: "An error occurred. Please try again.",
        loading: false,
      }));
    }
  }

  async function handleTotpVerify() {
    if (!state.totpCode.trim()) {
      setState((prev) => ({ ...prev, error: "Please enter the 6-digit code" }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: state.totpCode,
      });

      if (result.error) {
        setState((prev) => ({
          ...prev,
          error: result.error.message || "Invalid TOTP code",
          loading: false,
        }));
        return;
      }

      try {
        await logMfaEvent("user.mfa_enrolled", "TOTP enrolled and verified");
      } catch (logError) {
        console.error("Failed to log MFA enrollment:", logError);
      }
      router.push("/admin");
    } catch {
      setState((prev) => ({
        ...prev,
        error: "An error occurred. Please try again.",
        loading: false,
      }));
    }
  }

  if (state.step === "password") {
    return (
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Authenticator Setup</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your password to begin MFA enrollment.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              value={state.password}
              onChange={(e) =>
                setState((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Enter your password"
              disabled={state.loading}
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <Button
            onClick={handlePasswordSubmit}
            disabled={!state.password || state.loading}
            className="w-full"
          >
            {state.loading ? "Loading..." : "Next"}
          </Button>
        </div>
      </div>
    );
  }

  if (state.step === "qr") {
    return (
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Scan QR Code</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Scan this code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {state.totpURI && (
            <div className="p-4 bg-white rounded-lg">
              <QRCode value={state.totpURI} size={200} level="H" />
            </div>
          )}

          <div className="w-full">
            <p className="text-xs text-muted-foreground mb-2">
              Can&apos;t scan? Enter this code manually:
            </p>
            <code className="text-xs bg-muted p-2 rounded w-full block break-all text-center">
              {state.totpURI}
            </code>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Backup Codes</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Save these codes in a safe place. You can use them to access your account if you lose access to your authenticator.
            </p>
            <div className="bg-muted p-4 rounded space-y-1 font-mono text-sm max-h-40 overflow-y-auto">
              {state.backupCodes?.map((code, idx) => (
                <div key={idx}>
                  {idx + 1}. {code}
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={codeSaved}
              onChange={(e) => setCodeSaved(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">I have saved all backup codes securely</span>
          </label>

          <Button
            onClick={() => setState((prev) => ({ ...prev, step: "verify" }))}
            disabled={!codeSaved}
            className="w-full"
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  if (state.step === "verify") {
    return (
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Verify Code</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter the 6-digit code from your authenticator app to confirm setup.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totp-code">6-Digit Code</Label>
            <Input
              id="totp-code"
              type="text"
              maxLength={6}
              value={state.totpCode}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  totpCode: e.target.value.replace(/\D/g, ""),
                }))
              }
              placeholder="000000"
              className="text-center text-2xl tracking-widest"
              disabled={state.loading}
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <Button
            onClick={handleTotpVerify}
            disabled={state.totpCode.length !== 6 || state.loading}
            className="w-full"
          >
            {state.loading ? "Verifying..." : "Verify & Complete"}
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              setState((prev) => ({ ...prev, step: "qr", totpCode: "" }))
            }
            disabled={state.loading}
            className="w-full"
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
