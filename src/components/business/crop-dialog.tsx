"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  aspect?: number;
  initialCrop?: { x: number; y: number; width: number; height: number };
  onConfirm: (crop: { x: number; y: number; width: number; height: number }) => void;
  onSkip: () => void;
  isPending?: boolean;
}

export default function CropDialog({
  open,
  onOpenChange,
  imageUrl,
  aspect,
  initialCrop,
  onConfirm,
  onSkip,
  isPending,
}: CropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  function handleConfirm() {
    if (!croppedAreaPixels) return;
    onConfirm({
      x: Math.round(croppedAreaPixels.x),
      y: Math.round(croppedAreaPixels.y),
      width: Math.round(croppedAreaPixels.width),
      height: Math.round(croppedAreaPixels.height),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isPending) onSkip();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crop image</DialogTitle>
          <DialogDescription>
            Drag to reposition. Use the slider or scroll to zoom.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-64 w-full overflow-hidden rounded-md bg-black sm:h-80">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            initialCroppedAreaPixels={initialCrop}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-1">
          <label className="mb-1 block text-xs text-muted-foreground">
            Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onSkip} disabled={isPending}>
            Skip
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || !croppedAreaPixels}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Apply crop"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
