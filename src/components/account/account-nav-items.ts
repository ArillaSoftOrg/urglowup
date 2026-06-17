import {
  Home,
  CalendarDays,
  Heart,
  User,
  type LucideIcon,
} from "lucide-react";

export interface AccountNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const accountNavItems: AccountNavItem[] = [
  { title: "Ana Sayfa", href: "/account", icon: Home },
  { title: "Randevular", href: "/account/appointments", icon: CalendarDays },
  { title: "Favoriler", href: "/account/favorites", icon: Heart },
  { title: "Profil", href: "/account/profile", icon: User },
];
