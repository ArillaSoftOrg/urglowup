import Link from "next/link";
import {
  AlertTriangle,
  MessageSquare,
  FileX,
  ImageOff,
  ShieldOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AlertStripProps {
  pendingApprovals: number;
  pendingReviews: number;
  hiddenPosts: number;
  hiddenMedia: number;
  suspendedBusinesses: number;
}

export function AlertStrip({
  pendingApprovals,
  pendingReviews,
  hiddenPosts,
  hiddenMedia,
  suspendedBusinesses,
}: AlertStripProps) {
  const alerts = [
    {
      count: pendingApprovals,
      label: "pending approvals",
      icon: AlertTriangle,
      href: "/admin/businesses",
    },
    {
      count: pendingReviews,
      label: "pending reviews",
      icon: MessageSquare,
      href: "/admin/reviews",
    },
    {
      count: hiddenPosts,
      label: "hidden/removed posts",
      icon: FileX,
      href: "/admin/posts",
    },
    {
      count: hiddenMedia,
      label: "hidden/removed media",
      icon: ImageOff,
      href: "/admin/media",
    },
    {
      count: suspendedBusinesses,
      label: "suspended businesses",
      icon: ShieldOff,
      href: "/admin/businesses",
    },
  ];

  const activeAlerts = alerts.filter((a) => a.count > 0);

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 px-4 py-2.5">
      {activeAlerts.map(({ count, label, icon: Icon, href }) => (
        <Link key={label} href={href}>
          <Badge variant="warning" className="gap-1.5">
            <Icon className="size-3.5" />
            <span>
              {count} {label}
            </span>
          </Badge>
        </Link>
      ))}
    </div>
  );
}
