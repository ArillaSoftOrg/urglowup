import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_VARIANTS } from "@/lib/constants/booking";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentStatus;
}) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
