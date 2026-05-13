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
import { Loader2, Plus, Tag, Trash2, Pencil } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/(admin)/admin/actions";
import type { AdminCategory } from "@/lib/queries/admin";

// ─── Slug helpers ─────────────────────────────────────────────

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

// ─── Category Form (shared by create and edit) ────────────────

interface CategoryFormFields {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
}

const EMPTY_FORM: CategoryFormFields = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  sortOrder: "0",
};

interface CategoryFormProps {
  initial?: CategoryFormFields;
  categoryId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  submitLabel: string;
}

function CategoryForm({
  initial = EMPTY_FORM,
  categoryId,
  onSuccess,
  onCancel,
  submitLabel,
}: CategoryFormProps) {
  const [fields, setFields] = useState<CategoryFormFields>(initial);
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
    if (categoryId) formData.set("categoryId", categoryId);
    formData.set("name", fields.name);
    formData.set("slug", fields.slug);
    formData.set("description", fields.description);
    formData.set("imageUrl", fields.imageUrl);
    formData.set("sortOrder", fields.sortOrder);

    startTransition(async () => {
      const result = categoryId
        ? await updateCategory({ success: false }, formData)
        : await createCategory({ success: false }, formData);
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
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={fields.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Hair & Beauty"
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={fields.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="hair-beauty"
            maxLength={100}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={fields.description}
          onChange={(e) =>
            setFields((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Optional description..."
          maxLength={500}
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={fields.imageUrl}
            onChange={(e) =>
              setFields((prev) => ({ ...prev, imageUrl: e.target.value }))
            }
            placeholder="https://..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            type="number"
            min={0}
            value={fields.sortOrder}
            onChange={(e) =>
              setFields((prev) => ({ ...prev, sortOrder: e.target.value }))
            }
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
  category,
  open,
  onOpenChange,
}: {
  category: AdminCategory;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update details for &ldquo;{category.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          initial={{
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            imageUrl: category.imageUrl ?? "",
            sortOrder: String(category.sortOrder),
          }}
          categoryId={category.id}
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
  category,
  open,
  onOpenChange,
}: {
  category: AdminCategory;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (!result.success) {
        setError(result.message ?? "Failed to delete.");
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{category.name}&rdquo;? This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Category Row ─────────────────────────────────────────────

function CategoryRow({ category }: { category: AdminCategory }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canDelete = category._count.businesses === 0;

  return (
    <>
      <div className="flex items-center justify-between border-b p-3 last:border-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{category.name}</span>
            <Badge variant="secondary" className="text-xs">
              {category._count.businesses} business
              {category._count.businesses !== 1 ? "es" : ""}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            /{category.slug} · order: {category.sortOrder}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
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
            disabled={!canDelete}
            title={
              canDelete
                ? "Delete"
                : `Cannot delete: ${category._count.businesses} business${
                    category._count.businesses !== 1 ? "es" : ""
                  } use this category`
            }
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <EditDialog
        category={category}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteDialog
        category={category}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function CategoryManager({
  categories,
}: {
  categories: AdminCategory[];
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      {/* Category list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">
            Categories ({categories.length})
          </CardTitle>
          <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
            <Plus className="size-4" />
            New Category
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Tag className="size-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No categories yet
              </p>
            </div>
          ) : (
            categories.map((c) => <CategoryRow key={c.id} category={c} />)
          )}
        </CardContent>
      </Card>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <CategoryForm
              onSuccess={() => setShowCreate(false)}
              onCancel={() => setShowCreate(false)}
              submitLabel="Create Category"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
