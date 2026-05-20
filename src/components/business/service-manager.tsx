"use client";

import { useState, useActionState, useEffect } from "react";
import {
  createService,
  updateService,
  toggleServiceActive,
  type ServiceActionState,
} from "@/app/(business)/business/services/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Clock,
  Plus,
  Pencil,
  Scissors,
  Power,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

export type ServiceData = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number | null;
  priceType: string;
  isActive: boolean;
  sortOrder: number;
};

const PRICE_TYPE_LABELS: Record<string, string> = {
  FIXED: "Fixed price",
  STARTS_FROM: "Starts from",
  CONSULTATION_REQUIRED: "Price on consultation",
  FREE_CONSULTATION: "Free consultation",
};

function formatPrice(service: ServiceData) {
  if (service.priceType === "FREE_CONSULTATION") return "Free consultation";
  if (service.priceType === "CONSULTATION_REQUIRED")
    return "Price on consultation";
  if (service.price == null) return null;
  const amount = `$${service.price}`;
  if (service.priceType === "STARTS_FROM") return `From ${amount}`;
  return amount;
}

// ─── Service Form ───────────────────────────────────────────────

function ServiceForm({
  service,
  onClose,
}: {
  service?: ServiceData;
  onClose: () => void;
}) {
  const isEdit = !!service;
  const action = isEdit ? updateService : createService;
  const initial: ServiceActionState = { success: false };

  const [state, formAction, isPending] = useActionState(action, initial);
  const [priceType, setPriceType] = useState(service?.priceType ?? "FIXED");

  const priceDisabled =
    priceType === "CONSULTATION_REQUIRED" || priceType === "FREE_CONSULTATION";

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEdit ? "Edit Service" : "Add Service"}
        </CardTitle>
        <CardDescription>
          {isEdit
            ? "Update service details"
            : "Add a new service to your business"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="serviceId" value={service.id} />}
          {/* Hidden input ensures priceType is always in FormData */}
          <input type="hidden" name="priceType" value={priceType} />

          {state.message && !state.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={service?.name ?? ""}
                placeholder="e.g. Haircut"
                required
              />
              {state.errors?.name && (
                <p className="text-xs text-destructive">{state.errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min={5}
                max={480}
                defaultValue={service?.durationMinutes ?? 30}
                required
              />
              {state.errors?.durationMinutes && (
                <p className="text-xs text-destructive">
                  {state.errors.durationMinutes}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={service?.description ?? ""}
              placeholder="Describe the service..."
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Price type</Label>
              <Select
                value={priceType}
                onValueChange={(v) => { if (v !== null) setPriceType(v); }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Fixed price</SelectItem>
                  <SelectItem value="STARTS_FROM">Starts from</SelectItem>
                  <SelectItem value="CONSULTATION_REQUIRED">
                    Price on consultation
                  </SelectItem>
                  <SelectItem value="FREE_CONSULTATION">
                    Free consultation
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step={0.01}
                defaultValue={service?.price ?? ""}
                disabled={priceDisabled}
                placeholder={priceDisabled ? "N/A" : "0.00"}
              />
              {state.errors?.price && (
                <p className="text-xs text-destructive">{state.errors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={service?.sortOrder ?? 0}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked={service?.isActive ?? true}
              className="size-4 rounded border-input"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Update Service"
                  : "Add Service"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Service Card ───────────────────────────────────────────────

function ServiceCard({
  service,
  onEdit,
}: {
  service: ServiceData;
  onEdit: () => void;
}) {
  const price = formatPrice(service);
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    await toggleServiceActive(service.id);
    setToggling(false);
  }

  return (
    <Card className={service.isActive ? undefined : "opacity-60"}>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{service.name}</p>
            <Badge variant={service.isActive ? "pink" : "secondary"}>
              {service.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {service.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {service.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {service.durationMinutes} min
            </span>
            {price && <span>{price}</span>}
            <span className="text-[10px]">
              {PRICE_TYPE_LABELS[service.priceType]}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            disabled={toggling}
            title={service.isActive ? "Deactivate" : "Activate"}
          >
            <Power className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit} title="Edit">
            <Pencil className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Service Manager ────────────────────────────────────────────

export function ServiceManager({
  initialServices,
}: {
  initialServices: ServiceData[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | undefined>(
    undefined
  );

  function handleAdd() {
    setEditingService(undefined);
    setShowForm(true);
  }

  function handleEdit(service: ServiceData) {
    setEditingService(service);
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditingService(undefined);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Manage your business services"
        action={
          !showForm ? (
            <Button onClick={handleAdd} className="gap-1.5">
              <Plus className="size-4" />
              Add Service
            </Button>
          ) : undefined
        }
      />

      {showForm && (
        <ServiceForm service={editingService} onClose={handleClose} />
      )}

      {initialServices.length === 0 && !showForm ? (
        <EmptyState
          icon={Scissors}
          headline="No services yet"
          description="Add your first service to start accepting bookings."
          action={{ label: "Add Service", onClick: handleAdd }}
          surface="pink"
        />
      ) : (
        <div className="space-y-3">
          {initialServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={() => handleEdit(service)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
