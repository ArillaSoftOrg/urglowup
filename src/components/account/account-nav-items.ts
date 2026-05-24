import {
  LayoutDashboard,
  User,
  CalendarDays,
  MessageSquare,
  Heart,
  Star,
  MapPin,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface AccountNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const accountNavItems: AccountNavItem[] = [
  { title: "Genel Bakış", href: "/account", icon: LayoutDashboard },
  { title: "Profil", href: "/account/profile", icon: User },
  { title: "Randevularım", href: "/account/appointments", icon: CalendarDays },
  { title: "Mesajlar", href: "/account/messages", icon: MessageSquare },
  { title: "Favorilerim", href: "/account/favorites", icon: Heart },
  { title: "Yorumlarım", href: "/account/reviews", icon: Star },
  { title: "Hizmet Adresi", href: "/account/address", icon: MapPin },
  { title: "Ayarlar", href: "/account/settings", icon: Settings },
];
