"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { logMfaEvent } from "@/app/(admin-mfa)/admin/mfa/actions";

interface ChallengeState {
  loading: boolean;
  error?: string;
  totpCode: string;
  backupCode: string;
  trustDevice: boolean;
}

export function MfaChallengeForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [state, setState] = useState<ChallengeState>({
    loading: false,
    totpCode: "",
    backupCode: "",
    trustDevice: false,
  });

  async function handleTotpVerify() {
    if (!state.totpCode.trim()) {
      setState((prev) => ({ ...prev, error: "Please enter the 6-digit code" }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: state.totpCode,
        trustDevice: state.trustDevice,
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
        await logMfaEvent("user.mfa_challenge_passed", "TOTP challenge completed");
      } catch (logError) {
        console.error("Failed to log MFA challenge:", logError);
      }
      router.push(redirectTo);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "An error occurred. Please try again.",
        loading: false,
      }));
    }
  }

  async function handleBackupCodeVerify() {
    if (!state.backupCode.trim()) {
      setState((prev) => ({ ...prev, error: "Please enter a backup code" }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const result = await authClient.twoFactor.verifyBackupCode({
        code: state.backupCode.replace(/\s/g, ""),
      });

      if (result.error) {
        setState((prev) => ({
          ...prev,
          error: result.error.message || "Invalid backup code",
          loading: false,
        }));
        return;
      }

      try {
        await logMfaEvent("user.mfa_challenge_backup_used", "Backup code used");
      } catch (logError) {
        console.error("Failed to log MFA backup-code challenge:", logError);
      }
      router.push(redirectTo);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "An error occurred. Please try again.",
        loading: false,
      }));
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Two-Factor Verification</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your authenticator code or use a backup code.
        </p>
      </div>

      <Tabs defaultValue="totp" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="totp">Authenticator</TabsTrigger>
          <TabsTrigger value="backup">Backup Code</TabsTrigger>
        </TabsList>

        <TabsContent value="totp" className="space-y-4">
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
                  error: undefined,
                }))
              }
              placeholder="000000"
              className="text-center text-2xl tracking-widest"
              disabled={state.loading}
            />
          </div>

          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={state.trustDevice}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  trustDevice: e.target.checked,
                }))
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm">Trust this device for 30 days</span>
          </label>

          {state.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <Button
            onClick={handleTotpVerify}
            disabled={state.totpCode.length !== 6 || state.loading}
            className="w-full"
          >
            {state.loading ? "Verifying..." : "Verify"}
          </Button>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-code">Backup Code</Label>
            <Input
              id="backup-code"
              type="text"
              value={state.backupCode}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  backupCode: e.target.value,
                  error: undefined,
                }))
              }
              placeholder="Enter backup code"
              className="font-mono"
              disabled={state.loading}
            />
            <p className="text-xs text-muted-foreground">
              Enter one of your saved backup codes.
            </p>
          </div>

          {state.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <Button
            onClick={handleBackupCodeVerify}
            disabled={!state.backupCode.trim() || state.loading}
            className="w-full"
          >
            {state.loading ? "Verifying..." : "Verify"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
