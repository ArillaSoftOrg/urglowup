"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, ImagePlus } from "lucide-react";
import { saveMediaRecord } from "@/app/(business)/business/media/actions";
import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  IMAGE_ACCEPT,
  VIDEO_ACCEPT,
  formatFileSize,
} from "@/lib/constants/media";
import type { MediaType } from "@/generated/prisma/enums";

interface MediaUploadButtonProps {
  mediaType: MediaType;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function MediaUploadButton({
  mediaType,
  label,
  variant = "outline",
  size = "default",
  className,
}: MediaUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const isVideo = mediaType === "PORTFOLIO_VIDEO";
  const accept = isVideo ? VIDEO_ACCEPT : IMAGE_ACCEPT;
  const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  const allowedMimes = isVideo
    ? (ALLOWED_VIDEO_MIMES as readonly string[])
    : (ALLOWED_IMAGE_MIMES as readonly string[]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";

    setError(null);

    // Client-side validation
    if (!allowedMimes.includes(file.type)) {
      setError(`Invalid file type. Allowed: ${isVideo ? "MP4, MOV, WebM" : "JPEG, PNG, WebP"}`);
      return;
    }
    if (file.size > maxSize) {
      setError(`File too large. Maximum: ${formatFileSize(maxSize)}`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Get signed upload params
      const signRes = await fetch("/api/media/sign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType }),
      });

      if (!signRes.ok) {
        const data = await signRes.json();
        throw new Error(data.error || "Failed to get upload signature.");
      }

      const { signature, timestamp, apiKey, cloudName, folder, resourceType } =
        await signRes.json();

      // Step 2: Direct upload to Cloudinary via XMLHttpRequest (for progress)
      const cloudinaryResponse = await new Promise<Record<string, unknown>>(
        (resolve, reject) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("api_key", apiKey);
          formData.append("timestamp", String(timestamp));
          formData.append("signature", signature);
          formData.append("folder", folder);

          const xhr = new XMLHttpRequest();
          xhr.open(
            "POST",
            `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
          );

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              try {
                const err = JSON.parse(xhr.responseText);
                reject(new Error(err.error?.message || "Upload failed."));
              } catch {
                reject(new Error("Upload failed."));
              }
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload."));
          xhr.send(formData);
        }
      );

      // Step 3: Save DB record via server action
      startTransition(async () => {
        const result = await saveMediaRecord({
          publicId: cloudinaryResponse.public_id as string,
          url: cloudinaryResponse.secure_url as string,
          mediaType,
          resourceType: cloudinaryResponse.resource_type as "image" | "video",
          format: cloudinaryResponse.format as string,
          bytes: cloudinaryResponse.bytes as number,
          duration: cloudinaryResponse.duration as number | undefined,
          title: "",
        });

        if (!result.success) {
          setError(result.message ?? "Failed to save media record.");
        }

        setUploading(false);
        setProgress(0);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setUploading(false);
      setProgress(0);
    }
  }

  const buttonLabel =
    label ??
    (mediaType === "COVER"
      ? "Upload cover"
      : mediaType === "LOGO"
        ? "Upload logo"
        : "Upload");

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {progress > 0 ? `${progress}%` : "Uploading..."}
          </>
        ) : (
          <>
            {mediaType === "COVER" || mediaType === "LOGO" ? (
              <ImagePlus className="size-4" />
            ) : (
              <Upload className="size-4" />
            )}
            {buttonLabel}
          </>
        )}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
