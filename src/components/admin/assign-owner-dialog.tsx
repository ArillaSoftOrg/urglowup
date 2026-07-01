"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { adminAssignOwner } from "@/app/(admin)/admin/actions";

export function AssignOwnerDialog({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setOpen(true);
    setEmail("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await adminAssignOwner({ businessId, userEmail: email });
      if (res.success) {
        setOpen(false);
        setEmail("");
        router.refresh();
      } else {
        setError(res.message ?? "Bir hata oluştu.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={handleOpen}>
        Owner Ata
      </Button>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Sahip Ata</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="space-y-1">
              <Label>Kullanıcı E-postası</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kullanici@email.com"
                required
                disabled={isPending}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-destructive border border-destructive/30 bg-destructive/10 rounded px-2 py-1">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isPending} />}>
              İptal
            </DialogClose>
            <Button type="submit" disabled={isPending || !email.trim()}>
              {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              Ata
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
