"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  addTemplateServices,
  createService,
  toggleServiceActive,
  updateService,
  type ServiceActionState,
} from "@/app/(business)/business/services/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Power,
  Scissors,
  Search,
  Sparkles,
  Tags,
} from "lucide-react";

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

export type TemplateData = {
  name: string;
  category: string;
  durationMinutes: number;
  description?: string;
  price?: number;
  priceType?: string;
  tags?: string[];
  packageIds?: string[];
};

type TemplateEdit = {
  durationMinutes: number;
  price: string;
};

const PRICE_TYPE_LABELS: Record<string, string> = {
  FIXED: "Sabit fiyat",
  STARTS_FROM: "Başlangıç fiyatı",
  CONSULTATION_REQUIRED: "Danışma ücreti",
  FREE_CONSULTATION: "Ücretsiz danışma",
};

const TEMPLATE_PACKAGES = [
  {
    id: "barber-basics",
    label: "Berber başlangıç",
    description: "Saç, sakal ve hızlı bakım",
  },
  {
    id: "hair-salon-basics",
    label: "Kuaför başlangıç",
    description: "Kesim, boya, röfle ve fön",
  },
  {
    id: "beauty-salon-basics",
    label: "Güzellik salonu",
    description: "Cilt, tırnak, kaş ve kirpik",
  },
  {
    id: "skin-care-basics",
    label: "Cilt bakımı",
    description: "Bakım, peeling ve lazer",
  },
  {
    id: "spa-basics",
    label: "Spa ve masaj",
    description: "Masaj ve rahatlama servisleri",
  },
];

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase("tr");
}

function formatTemplatePrice(template: TemplateData, price?: string) {
  if (template.priceType === "FREE_CONSULTATION") return "Ücretsiz danışma";
  if (template.priceType === "CONSULTATION_REQUIRED") return "Danışma ücreti";
  const value = price ?? (template.price != null ? String(template.price) : "");
  if (!value) return "Fiyat eklenmedi";
  const amount = `₺${value}`;
  if (template.priceType === "STARTS_FROM") return `Başlangıç ${amount}`;
  return amount;
}

function formatPrice(service: ServiceData) {
  if (service.priceType === "FREE_CONSULTATION") return "Ücretsiz danışma";
  if (service.priceType === "CONSULTATION_REQUIRED") return "Danışma ücreti";
  if (service.price == null) return null;
  const amount = `₺${service.price}`;
  if (service.priceType === "STARTS_FROM") return `Başlangıç ${amount}`;
  return amount;
}

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
                onValueChange={(value) => {
                  if (value !== null) setPriceType(value);
                }}
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
            <p className="line-clamp-2 text-xs text-muted-foreground">
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
            <span className="sr-only">
              {service.isActive ? "Devre dışı bırak" : "Etkinleştir"}
            </span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit} title="Düzenle">
            <Pencil className="size-4" />
            <span className="sr-only">Düzenle</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateServicesPanel({
  templates,
  existingServices,
  onClose,
  onComplete,
}: {
  templates: TemplateData[];
  existingServices: ServiceData[];
  onClose: () => void;
  onComplete: (message: string) => void;
}) {
  const initial: ServiceActionState = { success: false };
  const [state, formAction, isPending] = useActionState(
    addTemplateServices,
    initial
  );
  const existingNames = useMemo(
    () => new Set(existingServices.map((service) => normalizeName(service.name))),
    [existingServices]
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const [edits, setEdits] = useState<Record<string, TemplateEdit>>(() =>
    Object.fromEntries(
      templates.map((template) => [
        template.name,
        {
          durationMinutes: template.durationMinutes,
          price: template.price != null ? String(template.price) : "",
        },
      ])
    )
  );

  useEffect(() => {
    if (state.success) {
      onComplete(state.message ?? "Hizmetler eklendi");
      onClose();
    }
  }, [state.success, state.message, onClose, onComplete]);

  const categories = useMemo(
    () => ["Tümü", ...Array.from(new Set(templates.map((t) => t.category)))],
    [templates]
  );
  const availableCount = templates.filter(
    (template) => !existingNames.has(normalizeName(template.name))
  ).length;
  const selectedTemplates = templates.filter(
    (template) =>
      selected.has(template.name) && !existingNames.has(normalizeName(template.name))
  );
  const filteredTemplates = templates.filter((template) => {
    const query = search.trim().toLocaleLowerCase("tr");
    const matchesSearch =
      !query ||
      template.name.toLocaleLowerCase("tr").includes(query) ||
      template.category.toLocaleLowerCase("tr").includes(query) ||
      template.description?.toLocaleLowerCase("tr").includes(query);
    const matchesCategory =
      activeCategory === "Tümü" || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  function toggleTemplate(template: TemplateData) {
    if (existingNames.has(normalizeName(template.name))) return;
    const next = new Set(selected);
    if (next.has(template.name)) {
      next.delete(template.name);
    } else {
      next.add(template.name);
    }
    setSelected(next);
  }

  function selectPackage(packageId: string) {
    const next = new Set(selected);
    for (const template of templates) {
      if (
        template.packageIds?.includes(packageId) &&
        !existingNames.has(normalizeName(template.name))
      ) {
        next.add(template.name);
      }
    }
    setSelected(next);
  }

  function updateEdit(name: string, edit: Partial<TemplateEdit>) {
    setEdits((current) => ({
      ...current,
      [name]: { ...current[name], ...edit },
    }));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">
              Şablondan hızlı hizmet ekle
            </CardTitle>
            <CardDescription>
              Paket seçin, hizmetleri düzenleyin ve işletmenizi hızlıca kurun.
            </CardDescription>
          </div>
          <Badge variant="purple">{availableCount} uygun şablon</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          {selectedTemplates.map((template) => {
            const edit = edits[template.name];
            return (
              <div key={template.name} className="hidden">
                <input name="templates" value={template.name} readOnly />
                <input
                  name={`duration-${template.name}`}
                  value={edit.durationMinutes}
                  readOnly
                />
                <input name={`price-${template.name}`} value={edit.price} readOnly />
              </div>
            );
          })}

          {state.message && !state.success && (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Hizmet veya kategori ara"
                aria-label="Hizmet veya kategori ara"
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setSelected(
                    new Set(
                      templates
                        .filter(
                          (template) =>
                            !existingNames.has(normalizeName(template.name))
                        )
                        .map((template) => template.name)
                    )
                  )
                }
              >
                Tümünü seç
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelected(new Set())}
              >
                Temizle
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATE_PACKAGES.map((templatePackage) => (
              <button
                key={templatePackage.id}
                type="button"
                onClick={() => selectPackage(templatePackage.id)}
                className="rounded-xl border border-border/70 bg-surface-cream p-3 text-left transition-colors hover:bg-surface-pink focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="size-4 text-muted-foreground" />
                  {templatePackage.label}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {templatePackage.description}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <Button
                key={category}
                type="button"
                size="sm"
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className="shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredTemplates.map((template) => {
              const isExisting = existingNames.has(normalizeName(template.name));
              const isSelected = selected.has(template.name) && !isExisting;
              const edit = edits[template.name];
              const priceLocked =
                template.priceType === "CONSULTATION_REQUIRED" ||
                template.priceType === "FREE_CONSULTATION";

              return (
                <div
                  key={template.name}
                  className={[
                    "rounded-xl border p-3 transition-colors",
                    isSelected
                      ? "border-ring bg-surface-pink"
                      : "border-border/70 bg-card",
                    isExisting ? "opacity-65" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`template-${template.name}`}
                      checked={isSelected}
                      disabled={isExisting}
                      onChange={() => toggleTemplate(template)}
                      className="mt-1 size-4 rounded border-input"
                    />
                    <label
                      htmlFor={`template-${template.name}`}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{template.name}</span>
                        <Badge variant="outline">{template.category}</Badge>
                        {isExisting && (
                          <Badge variant="neutral">Zaten eklendi</Badge>
                        )}
                        {template.tags?.map((tag) => (
                          <Badge key={tag} variant="pink">
                            {tag}
                          </Badge>
                        ))}
                      </span>
                      {template.description && (
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {template.description}
                        </span>
                      )}
                    </label>
                    <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
                      <span className="flex items-center justify-end gap-1">
                        <Clock className="size-3" />
                        {edit.durationMinutes} min
                      </span>
                      <span>{formatTemplatePrice(template, edit.price)}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 grid gap-3 border-t border-border/60 pt-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor={`duration-${template.name}`}>
                          Süre (dk)
                        </Label>
                        <Input
                          id={`duration-${template.name}`}
                          type="number"
                          min={5}
                          max={480}
                          value={edit.durationMinutes}
                          onChange={(event) =>
                            updateEdit(template.name, {
                              durationMinutes: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`price-${template.name}`}>
                          Önerilen fiyat (₺)
                        </Label>
                        <Input
                          id={`price-${template.name}`}
                          type="number"
                          min={0}
                          step={0.01}
                          disabled={priceLocked}
                          value={edit.price}
                          placeholder={priceLocked ? "N/A" : "0.00"}
                          onChange={(event) =>
                            updateEdit(template.name, {
                              price: event.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredTemplates.length === 0 && (
              <div className="rounded-xl border border-border/70 bg-surface-cream p-4 text-sm text-muted-foreground">
                Aramanıza uygun şablon bulunamadı.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {selectedTemplates.length > 0 ? (
                <CheckCircle2 className="size-4 text-success-foreground" />
              ) : (
                <Tags className="size-4" />
              )}
              <span>{selectedTemplates.length} hizmet seçildi</span>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isPending || selectedTemplates.length === 0}
                className="flex-1 sm:flex-none"
              >
                {isPending
                  ? "Ekleniyor..."
                  : `${selectedTemplates.length} Hizmeti Ekle`}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                İptal
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

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
  const [editingService, setEditingService] = useState<ServiceData | undefined>();
  const [notice, setNotice] = useState<string | null>(null);

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
            <div className="flex flex-wrap gap-2">
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

      {notice && mode === "list" && (
        <div
          className="rounded-xl border border-border/70 bg-success/30 p-3 text-sm text-success-foreground"
          role="status"
          aria-live="polite"
        >
          {notice}
        </div>
      )}

      {mode === "form" && (
        <ServiceForm service={editingService} onClose={handleClose} />
      )}

      {mode === "templates" && hasTemplates && (
        <TemplateServicesPanel
          templates={availableTemplates}
          existingServices={initialServices}
          onClose={handleClose}
          onComplete={setNotice}
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
