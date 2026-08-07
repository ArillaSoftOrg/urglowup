"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocaleSwitcher } from "./locale-switcher";

interface LanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoggedIn: boolean;
  title: string;
}

export function LanguageDialog({
  open,
  onOpenChange,
  isLoggedIn,
  title,
}: LanguageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <LocaleSwitcher isLoggedIn={isLoggedIn} variant="settings" />
      </DialogContent>
    </Dialog>
  );
}
