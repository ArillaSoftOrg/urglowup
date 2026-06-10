import {
  LayoutDashboard,
  CalendarCheck,
  Scissors,
  ImageIcon,
  LayoutGrid,
  User,
  Clock,
  Star,
  Users,
  Users2,
  Link2,
  Plug,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { BusinessMemberRole } from "@/generated/prisma/enums";

export interface BusinessNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  minRole?: BusinessMemberRole;
}

export const businessNavItems: BusinessNavItem[] = [
  { title: "Kontrol Paneli", href: "/business/dashboard", icon: LayoutDashboard },
  { title: "Randevular", href: "/business/appointments", icon: CalendarCheck },
  { title: "Hizmetler", href: "/business/services", icon: Scissors },
  { title: "Galeri", href: "/business/media", icon: ImageIcon },
  { title: "Gönderiler", href: "/business/posts", icon: LayoutGrid },
  { title: "Profil", href: "/business/profile", icon: User },
  { title: "Çalışma Saatleri", href: "/business/hours", icon: Clock },
  { title: "Değerlendirmeler", href: "/business/reviews", icon: Star },
  { title: "Müşteriler", href: "/business/customers", icon: Users },
  { title: "Ekip", href: "/business/team", icon: Users2, minRole: BusinessMemberRole.OWNER },
  { title: "Randevu Linki", href: "/business/public-link", icon: Link2 },
  { title: "Entegrasyonlar", href: "/business/integrations", icon: Plug },
  { title: "Ayarlar", href: "/business/settings", icon: Settings },
];
