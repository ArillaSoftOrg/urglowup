"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Tag, Trash2, Pencil, Power } from "lucide-react";
import {
  createStyleTag,
  updateStyleTag,
  toggleStyleTagActive,
  deleteStyleTag,
} from "@/app/(admin)/admin/actions";
import type { AdminStyleTag } from "@/lib/queries/style-tags";
import type { AdminCategory } from "@/lib/queries/admin";

// ─── Slug helpers ─────────────────────────────────────────────

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

// ─── Style Tag Form ────────────────────────────────────────────

interface StyleTagFormFields {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  sortOrder: string;
}

const EMPTY_FORM: StyleTagFormFields = {
  name: "",
  slug: "",
  description: "",
  categoryId: "",
  sortOrder: "0",
};

interface StyleTagFormProps {
  initial?: StyleTagFormFields;
  styleTagId?: string;
  categories: AdminCategory[];
  onSuccess: () => void;
  onCancel?: () => void;
  submitLabel: string;
}

function StyleTagForm({
  initial = EMPTY_FORM,
  styleTagId,
  categories,
  onSuccess,
  onCancel,
  submitLabel,
}: StyleTagFormProps) {
  const [fields, setFields] = useState<StyleTagFormFields>(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleNameChange(value: string) {
    setFields((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : toSlug(value),
    }));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setFields((prev) => ({ ...prev, slug: value }));
  }

  function handleSubmit() {
    setError(null);
    const formData = new FormData();
    if (styleTagId) formData.set("styleTagId", styleTagId);
    formData.set("name", fields.name);
    formData.set("slug", fields.slug);
    formData.set("description", fields.description);
    formData.set("categoryId", fields.categoryId);
    formData.set("sortOrder", fields.sortOrder);

    startTransition(async () => {
      const result = styleTagId
        ? await updateStyleTag({ success: false }, formData)
        : await createStyleTag({ success: false }, formData);
      if (!result.success) {
        setError(result.message ?? "Something went wrong.");
      } else {
        onSuccess();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="st-name">Name *</Label>
          <Input
            id="st-name"
            value={fields.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Taper Fade"
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="st-slug">Slug *</Label>
          <Input
            id="st-slug"
            value={fields.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="taper-fade"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">URL: /styles/{fields.slug || "…"}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="st-description">Description</Label>
        <Textarea
          id="st-description"
          value={fields.description}
          onChange={(e) => setFields((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="1–3 sentence guide intro shown on the Style Atlas page."
          maxLength={500}
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="st-category">Category</Label>
          <select
            id="st-category"
            value={fields.categoryId}
            onChange={(e) => setFields((prev) => ({ ...prev, categoryId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">— Any category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="st-sort">Sort Order</Label>
          <Input
            id="st-sort"
            type="number"
            min={0}
            value={fields.sortOrder}
            onChange={(e) => setFields((prev) => ({ ...prev, sortOrder: e.target.value }))}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────

function EditDialog({
  tag,
  categories,
  open,
  onOpenChange,
}: {
  tag: AdminStyleTag;
  categories: AdminCategory[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Style Tag</DialogTitle>
          <DialogDescription>Update &ldquo;{tag.name}&rdquo;.</DialogDescription>
        </DialogHeader>
        <StyleTagForm
          initial={{
            name: tag.name,
            slug: tag.slug,
            description: tag.description ?? "",
            categoryId: tag.categoryId ?? "",
            sortOrder: String(tag.sortOrder),
          }}
          styleTagId={tag.id}
          categories={categories}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
          submitLabel="Save Changes"
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────

function DeleteDialog({
  tag,
  open,
  onOpenChange,
}: {
  tag: AdminStyleTag;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteStyleTag(tag.id);
      if (!result.success) {
        setError(result.message ?? "Failed to delete.");
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isPending) onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Style Tag</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{tag.name}&rdquo;? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? <><Loader2 className="size-4 animate-spin" />Deleting...</> : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Style Tag Row ────────────────────────────────────────────

function StyleTagRow({
  tag,
  categories,
}: {
  tag: AdminStyleTag;
  categories: AdminCategory[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleStyleTagActive(tag.id);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between border-b p-3 last:border-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${!tag.isActive ? "text-muted-foreground line-through" : ""}`}>
              {tag.name}
            </span>
            {tag.category && (
              <Badge variant="outline" className="text-xs">{tag.category.name}</Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {tag.postCount} post{tag.postCount !== 1 ? "s" : ""}
            </Badge>
            {!tag.isActive && <Badge variant="destructive" className="text-xs">inactive</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            /styles/{tag.slug} · order: {tag.sortOrder}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleToggle}
            disabled={isPending}
            title={tag.isActive ? "Deactivate" : "Activate"}
          >
            <Power className={`size-4 ${tag.isActive ? "text-emerald-600" : "text-muted-foreground"}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={tag.postCount > 0}
            title={tag.postCount > 0 ? `Cannot delete: ${tag.postCount} posts use this tag` : "Delete"}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <EditDialog tag={tag} categories={categories} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteDialog tag={tag} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function StyleTagManager({
  styleTags,
  categories,
}: {
  styleTags: AdminStyleTag[];
  categories: AdminCategory[];
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Style Tags ({styleTags.length})</CardTitle>
          <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
            <Plus className="size-4" />
            New Style Tag
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {styleTags.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Tag className="size-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No style tags yet</p>
            </div>
          ) : (
            styleTags.map((t) => <StyleTagRow key={t.id} tag={t} categories={categories} />)
          )}
        </CardContent>
      </Card>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Style Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <StyleTagForm
              categories={categories}
              onSuccess={() => setShowCreate(false)}
              onCancel={() => setShowCreate(false)}
              submitLabel="Create Style Tag"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
