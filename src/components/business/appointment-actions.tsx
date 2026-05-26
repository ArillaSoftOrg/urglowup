"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  X,
  CheckCircle,
  UserX,
  Ban,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import {
  confirmAppointment,
  rejectAppointment,
  cancelAppointmentByBusiness,
  completeAppointment,
  markNoShow,
} from "@/app/(business)/business/appointments/actions";
import { AppointmentNoteDialog } from "./appointment-note-dialog";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export function AppointmentActions({
  appointmentId,
  status,
  businessNote,
}: {
  appointmentId: string;
  status: AppointmentStatus;
  businessNote: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function runAction(action: (id: string) => Promise<unknown>) {
    startTransition(async () => {
      await action(appointmentId);
    });
  }

  if (isPending) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="size-4 animate-spin" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" />}
      >
        <MoreHorizontal className="size-4" />
        <span className="sr-only">İşlemler</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === "PENDING" && (
          <>
            <DropdownMenuItem onClick={() => runAction(confirmAppointment)}>
              <Check className="size-4" />
              Onayla
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => runAction(rejectAppointment)}>
              <X className="size-4" />
              Reddet
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {status === "CONFIRMED" && (
          <>
            <DropdownMenuItem onClick={() => runAction(completeAppointment)}>
              <CheckCircle className="size-4" />
              Tamamlandı olarak işaretle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => runAction(markNoShow)}>
              <UserX className="size-4" />
              Gelmedi olarak işaretle
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => runAction(cancelAppointmentByBusiness)}
            >
              <Ban className="size-4" />
              İptal et
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <AppointmentNoteDialog
          appointmentId={appointmentId}
          currentNote={businessNote}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
