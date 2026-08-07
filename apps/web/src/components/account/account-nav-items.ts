import {
  Home,
  CalendarDays,
  Heart,
  MessageCircle,
  CreditCard,
  Star,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";

export interface AccountNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

/** Full account section list — desktop top nav (AccountTopNav). */
export const accountNavItems: AccountNavItem[] = [
  { title: "Ana Sayfa", href: "/account", icon: Home },
  { title: "Randevular", href: "/account/appointments", icon: CalendarDays },
  { title: "Mesajlar", href: "/account/messages", icon: MessageCircle },
  { title: "Favoriler", href: "/account/favorites", icon: Heart },
  { title: "Ödemeler", href: "/account/payments", icon: CreditCard },
  { title: "Yorumlar", href: "/account/reviews", icon: Star },
  { title: "Ayarlar", href: "/account/settings", icon: Settings },
];

/** Fixed 4-item mobile bottom nav — kept small on purpose, see AccountMobileNav. */
export const accountMobileNavItems: AccountNavItem[] = [
  { title: "Ana Sayfa", href: "/account", icon: Home },
  { title: "Randevular", href: "/account/appointments", icon: CalendarDays },
  { title: "Favoriler", href: "/account/favorites", icon: Heart },
  { title: "Profil", href: "/account/profile", icon: User },
];
