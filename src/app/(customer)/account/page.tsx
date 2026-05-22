import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Heart,
  Star,
  UserRound,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Hesabım" };

const quickLinks = [
  {
    title: "Profil",
    description: "Kişisel bilgilerinizi yönetin",
    href: "/account/profile",
    icon: UserRound,
  },
  {
    title: "Randevularım",
    description: "Randevu isteklerinizi görüntüleyin",
    href: "/account/appointments",
    icon: CalendarDays,
  },
  {
    title: "Favorilerim",
    description: "Kaydettiğiniz işletmeler",
    href: "/account/favorites",
    icon: Heart,
  },
  {
    title: "Yorumlarım",
    description: "Yazdığınız yorumlar",
    href: "/account/reviews",
    icon: Star,
  },
];

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join("");

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hesabım</h1>
        <p className="text-muted-foreground">
          Profilinizi yönetin ve aktivitelerinizi görüntüleyin.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar className="size-14" size="lg">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={displayName} />}
            <AvatarFallback className="text-lg">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="group">
            <Card className="transition-colors group-hover:bg-accent/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <link.icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle>{link.title}</CardTitle>
                    <CardDescription>{link.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
