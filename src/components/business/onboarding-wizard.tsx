"use client";

import { useState, useActionState } from "react";
import {
  completeBusinessOnboarding,
  type OnboardingState,
} from "@/app/(business-onboarding)/business/onboarding/actions";
import { slugify } from "@/lib/slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Globe,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const CATEGORIES = [
  { label: "Hair Salon", value: "hair-salon" },
  { label: "Barber Shop", value: "barber-shop" },
  { label: "Nail Salon", value: "nail-salon" },
  { label: "Beauty Salon", value: "beauty-salon" },
  { label: "Spa & Wellness", value: "spa-wellness" },
  { label: "Skin Care", value: "skin-care" },
  { label: "Makeup Artist", value: "makeup-artist" },
  { label: "Lashes & Brows", value: "lashes-brows" },
  { label: "Tattoo & Piercing", value: "tattoo-piercing" },
  { label: "Other", value: "other" },
];

const STEPS = [
  { label: "Basics", icon: Building2 },
  { label: "Location", icon: MapPin },
  { label: "Profile", icon: Globe },
  { label: "Confirm", icon: CheckCircle2 },
];

export function OnboardingWizard() {
  const [step, setStep] = useState(0);

  // Form field state
  const [fields, setFields] = useState({
    name: "",
    description: "",
    category: "",
    phone: "",
    whatsapp: "",
    instagramUrl: "",
    city: "",
    district: "",
    address: "",
    slugOverride: "",
  });

  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    completeBusinessOnboarding,
    { success: false }
  );

  function update(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  const previewSlug = slugify(fields.slugOverride || fields.name) || "your-business";

  // Simple step validation
  function canProceed(): boolean {
    if (step === 0) return fields.name.length >= 2 && fields.category !== "";
    if (step === 1) return fields.city.length >= 1;
    return true;
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <nav className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <s.icon className="size-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-6 ${i < step ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </nav>

      {/* Global error */}
      {state.message && !state.success && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {/* Step 1: Basics */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Business Basics</CardTitle>
            <CardDescription>
              Tell us about your business. You can always update this later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business name *</Label>
              <Input
                id="name"
                value={fields.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Glamour Beauty Studio"
              />
              {state.errors?.name && (
                <p className="text-sm text-destructive">{state.errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={fields.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="A short description of your business..."
                rows={3}
              />
              {state.errors?.description && (
                <p className="text-sm text-destructive">
                  {state.errors.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => update("category", cat.value)}
                  >
                    <Badge
                      variant={
                        fields.category === cat.value ? "default" : "outline"
                      }
                      className="cursor-pointer"
                    >
                      {cat.label}
                    </Badge>
                  </button>
                ))}
              </div>
              {state.errors?.category && (
                <p className="text-sm text-destructive">
                  {state.errors.category}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Location & Contact */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Location & Contact</CardTitle>
            <CardDescription>
              Help customers find and reach you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={fields.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="e.g. Istanbul"
                />
                {state.errors?.city && (
                  <p className="text-sm text-destructive">
                    {state.errors.city}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={fields.district}
                  onChange={(e) => update("district", e.target.value)}
                  placeholder="e.g. Kadikoy"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full address</Label>
              <Textarea
                id="address"
                value={fields.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Street address..."
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={fields.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+90 555 000 0000"
                />
                {state.errors?.phone && (
                  <p className="text-sm text-destructive">
                    {state.errors.phone}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={fields.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                  placeholder="+90 555 000 0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input
                id="instagramUrl"
                value={fields.instagramUrl}
                onChange={(e) => update("instagramUrl", e.target.value)}
                placeholder="https://instagram.com/yourbusiness"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Public Profile */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Public Profile</CardTitle>
            <CardDescription>
              Customize how your business appears to customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="slugOverride">
                Custom URL slug{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="slugOverride"
                value={fields.slugOverride}
                onChange={(e) => update("slugOverride", e.target.value)}
                placeholder={slugify(fields.name) || "your-business"}
              />
              <p className="text-sm text-muted-foreground">
                Your public page will be at{" "}
                <span className="font-medium text-foreground">
                  /b/{previewSlug}
                </span>
              </p>
            </div>

            <div className="rounded-lg border border-dashed p-6 text-center">
              <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-muted">
                <Building2 className="size-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Cover & logo images</p>
              <p className="mt-1 text-xs text-muted-foreground">
                You can upload a cover image and logo after completing
                onboarding from your business dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirmation */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm & Launch</CardTitle>
            <CardDescription>
              Review your business details before creating your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="divide-y text-sm">
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Business name</dt>
                <dd className="font-medium">{fields.name}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium">
                  {CATEGORIES.find((c) => c.value === fields.category)?.label ??
                    fields.category}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">City</dt>
                <dd className="font-medium">{fields.city}</dd>
              </div>
              {fields.district && (
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">District</dt>
                  <dd className="font-medium">{fields.district}</dd>
                </div>
              )}
              {fields.phone && (
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{fields.phone}</dd>
                </div>
              )}
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Public link</dt>
                <dd className="font-medium text-primary">/b/{previewSlug}</dd>
              </div>
            </dl>

            <div className="rounded-md bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              Your business page will be live at{" "}
              <span className="font-medium text-foreground">
                /b/{previewSlug}
              </span>{" "}
              as a private profile. It won&apos;t appear in marketplace search
              until an admin activates marketplace visibility.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {step < 3 ? (
          <Button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <form action={formAction}>
            {/* Hidden fields carry all the wizard data */}
            {Object.entries(fields).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create My Business"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
