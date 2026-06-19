"use client";

import { useState, useActionState, useEffect } from "react";
import {
  createService,
  updateService,
  toggleServiceActive,
  addTemplateServices,
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
  Sparkles,
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
  FIXED: "Sabit fiyat",
  STARTS_FROM: "Başlangıç fiyatı",
  CONSULTATION_REQUIRED: "Danışma ücreti",
  FREE_CONSULTATION: "Ücretsiz danışma",
};

export type TemplateData = {
  name: string;
  durationMinutes: number;
  description?: string;
  priceType?: string;
};

function formatPrice(service: ServiceData) {
  if (service.priceType === "FREE_CONSULTATION") return "Ücretsiz danışma";
  if (service.priceType === "CONSULTATION_REQUIRED")
    return "Danışma ücreti";
  if (service.price == null) return null;
  const amount = `₺${service.price}`;
  if (service.priceType === "STARTS_FROM") return `Başlangıç ${amount}`;
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
          {isEdit ? "Hizmeti Düzenle" : "Hizmet Ekle"}
        </CardTitle>
        <CardDescription>
          {isEdit
            ? "Hizmet bilgilerini güncelleyin"
            : "İşletmenize yeni hizmet ekleyin"}
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
              <Label htmlFor="name">Ad</Label>
              <Input
                id="name"
                name="name"
                defaultValue={service?.name ?? ""}
                placeholder="örn. Saç Kesimi"
                required
              />
              {state.errors?.name && (
                <p className="text-xs text-destructive">{state.errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Süre (dakika)</Label>
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
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={service?.description ?? ""}
              placeholder="Hizmet açıklaması..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Fiyat türü</Label>
              <Select
                value={priceType}
                onValueChange={(v) => { if (v !== null) setPriceType(v); }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Sabit fiyat</SelectItem>
                  <SelectItem value="STARTS_FROM">Başlangıç fiyatı</SelectItem>
                  <SelectItem value="CONSULTATION_REQUIRED">
                    Danışma ücreti
                  </SelectItem>
                  <SelectItem value="FREE_CONSULTATION">
                    Ücretsiz danışma
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Fiyat (₺)</Label>
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
              <Label htmlFor="sortOrder">Sıra</Label>
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
            <Label htmlFor="isActive">Aktif</Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Kaydediliyor..."
                : isEdit
                  ? "Hizmeti Güncelle"
                  : "Hizmet Ekle"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
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
              {service.isActive ? "Aktif" : "Pasif"}
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
            title={service.isActive ? "Devre dışı bırak" : "Etkinleştir"}
          >
            <Power className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit} title="Düzenle">
            <Pencil className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Template Services Panel ────────────────────────────────────

function TemplateServicesPanel({
  templates,
  onClose,
}: {
  templates: TemplateData[];
  onClose: () => void;
}) {
  const initial: ServiceActionState = { success: false };
  const [state, formAction, isPending] = useActionState(
    addTemplateServices,
    initial
  );
  const [selected, setSelected] = useState<Set<string>>(
    new Set(templates.map((t) => t.name))
  );

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  const toggleTemplate = (name: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelected(newSelected);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Klasik hizmetlerle başlayın</CardTitle>
        <CardDescription>
          İşletmeniz için önerilen hizmetleri seçip tek tıkla ekleyin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.message && !state.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <div className="space-y-3">
            {templates.map((template) => (
              <div key={template.name} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`template-${template.name}`}
                  name="templates"
                  value={template.name}
                  checked={selected.has(template.name)}
                  onChange={() => toggleTemplate(template.name)}
                  className="size-4 rounded border-input"
                />
                <label
                  htmlFor={`template-${template.name}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {template.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {template.durationMinutes} min
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </label>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isPending || selected.size === 0}
              className="flex-1"
            >
              {isPending ? "Ekleniyor..." : "Seçilenleri Ekle"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              İptal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Service Manager ────────────────────────────────────────────

export function ServiceManager({
  initialServices,
  availableTemplates = [],
}: {
  initialServices: ServiceData[];
  availableTemplates?: TemplateData[];
}) {
  const hasServices = initialServices.length > 0;
  const hasTemplates = availableTemplates.length > 0;

  const [mode, setMode] = useState<"list" | "form" | "templates">(
    !hasServices && hasTemplates ? "templates" : "list"
  );
  const [editingService, setEditingService] = useState<ServiceData | undefined>(
    undefined
  );

  function handleAdd() {
    setEditingService(undefined);
    setMode("form");
  }

  function handleEdit(service: ServiceData) {
    setEditingService(service);
    setMode("form");
  }

  function handleClose() {
    setMode("list");
    setEditingService(undefined);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hizmetler"
        description="İşletmenizin hizmetlerini yönetin"
        action={
          mode === "list" ? (
            <div className="flex gap-2">
              {hasTemplates && (
                <Button
                  variant="outline"
                  onClick={() => setMode("templates")}
                  className="gap-1.5"
                >
                  <Sparkles className="size-4" />
                  Şablondan Ekle
                </Button>
              )}
              <Button onClick={handleAdd} className="gap-1.5">
                <Plus className="size-4" />
                Hizmet Ekle
              </Button>
            </div>
          ) : undefined
        }
      />

      {mode === "form" && (
        <ServiceForm service={editingService} onClose={handleClose} />
      )}

      {mode === "templates" && hasTemplates && (
        <TemplateServicesPanel
          templates={availableTemplates}
          onClose={handleClose}
        />
      )}

      {mode === "list" && !hasServices && (
        <EmptyState
          icon={Scissors}
          headline="Henüz hizmet yok"
          description="Randevu almaya başlamak için ilk hizmetinizi ekleyin."
          action={{ label: "Hizmet Ekle", onClick: handleAdd }}
          surface="pink"
        />
      )}

      {mode === "list" && hasServices && (
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
