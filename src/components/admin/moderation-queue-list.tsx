import { ModerationQueueRow } from "./moderation-queue-row";
import type { ModerationQueueItem } from "@/lib/admin/moderation-queue";

interface ModerationQueueListProps {
  items: ModerationQueueItem[];
}

export function ModerationQueueList({ items }: ModerationQueueListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ModerationQueueRow key={`${item.entityType}-${item.id}`} item={item} />
      ))}
    </div>
  );
}
