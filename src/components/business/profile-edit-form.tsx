"use client";

import { useActionState } from "react";
import {
  updateBusinessProfile,
  type ProfileActionState,
} from "@/app/(business)/business/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Link, MapPin, Phone } from "lucide-react";

interface BusinessProfileData {
  name: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagramUrl: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  slug: string;
  status: string;
  categoryName?: string | null;
}

function FieldError({ errors, name }: { errors?: Record<string, string[]>; name: string }) {
  const msgs = errors?.[name];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{msgs[0]}</p>;
}

export function ProfileEditForm({ business }: { business: BusinessProfileData }) {
  const initial: ProfileActionState = { success: false };
  const [state, formAction, isPending] = useActionState(updateBusinessProfile, initial);

  return (
    <form action={formAction} className="space-y-6">
      {state.success && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/15 p-3 text-sm text-success-foreground">
          <Check className="size-4 shrink-0" />
          {state.message}
        </div>
      )}
      {!state.success && state.message && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
          <CardDescription>Your business name and description visible on your public profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Business Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              name="name"
              defaultValue={business.name}
              placeholder="My Beauty Studio"
              className="mt-1.5"
            />
            <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="name" />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={business.description ?? ""}
              placeholder="Tell customers about your business, specialties, and experience…"
              className="mt-1.5 min-h-[100px] resize-none"
              maxLength={1000}
            />
            <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="description" />
          </div>

          <div className="rounded-xl bg-surface-cream p-3">
            <p className="text-xs font-medium text-muted-foreground">Category</p>
            <div className="mt-1 flex items-center gap-2">
              {business.categoryName ? (
                <Badge variant="secondary">{business.categoryName}</Badge>
              ) : (
                <span className="text-sm text-muted-foreground">No category set</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="size-4" />
            Contact Details
          </CardTitle>
          <CardDescription>How customers can reach you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={business.phone ?? ""}
                placeholder="+90 555 000 0000"
                className="mt-1.5"
              />
              <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="phone" />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={business.whatsapp ?? ""}
                placeholder="+90 555 000 0000"
                className="mt-1.5"
              />
              <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="whatsapp" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4" />
            Location
          </CardTitle>
          <CardDescription>Your business address shown on your public profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={business.address ?? ""}
              placeholder="123 Main Street, Suite 4"
              className="mt-1.5"
            />
            <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="address" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={business.city ?? ""}
                placeholder="Istanbul"
                className="mt-1.5"
              />
              <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="city" />
            </div>
            <div>
              <Label htmlFor="district">District / Neighbourhood</Label>
              <Input
                id="district"
                name="district"
                defaultValue={business.district ?? ""}
                placeholder="Kadıköy"
                className="mt-1.5"
              />
              <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="district" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link className="size-4" />
            Social Media
          </CardTitle>
          <CardDescription>Add your social profiles so customers can follow you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="instagramUrl">Instagram URL</Label>
            <Input
              id="instagramUrl"
              name="instagramUrl"
              defaultValue={business.instagramUrl ?? ""}
              placeholder="https://instagram.com/yourbusiness"
              className="mt-1.5"
            />
            <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="instagramUrl" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" variant="brand" disabled={isPending}>
          {isPending ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}
