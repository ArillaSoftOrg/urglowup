"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Pencil } from "lucide-react";
import { updateMediaMeta } from "@/app/(business)/business/media/actions";
import type { BusinessMediaItem } from "@/lib/queries/media";

interface ServiceOption {
  id: string;
  name: string;
}

export function MediaEditDialog({
  media,
  services,
}: {
  media: BusinessMediaItem;
  services: ServiceOption[];
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(media.title ?? "");
  const [description, setDescription] = useState(media.description ?? "");
  const [serviceId, setServiceId] = useState(media.relatedServiceId ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateMediaMeta(media.id, {
        title,
        description,
        relatedServiceId: serviceId,
      });
      if (!result.success) {
        setError(result.message ?? "Failed to update.");
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-accent"
          />
        }
      >
        <Pencil className="size-3" />
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit media</DialogTitle>
          <DialogDescription>
            Update title, description, or linked service.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="media-title">Title</Label>
            <Input
              id="media-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Add a title..."
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="media-desc">Description</Label>
            <Textarea
              id="media-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder="Add a description..."
            />
          </div>
          {services.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor="media-service">Linked service</Label>
              <select
                id="media-service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
