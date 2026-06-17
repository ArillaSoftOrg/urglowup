import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCustomerAppointments } from "@/lib/queries/appointments";
import { getCustomerReviews } from "@/lib/queries/reviews";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export const metadata = { title: "Hesabım" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [appointments, reviews, favoritesCount, savedPostsCount] = await Promise.all([
    getCustomerAppointments(user.id),
    getCustomerReviews(user.id),
    db.favorite.count({ where: { userId: user.id } }),
    db.postSave.count({ where: { userId: user.id } }),
  ]);

  const now = new Date();
  const upcomingAppointment = appointments.find(
    (a) =>
      (a.status === "PENDING" || a.status === "CONFIRMED") &&
      new Date(a.requestedDate) >= now
  );

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join("");

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hesabım</h1>
        <p className="text-muted-foreground">
          Hoş geldiniz. Randevularınızı ve aktivitelerinizi takip edin.
        </p>
      </div>

      {/* Upcoming appointment */}
      {upcomingAppointment ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Yaklaşan Randevu
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="font-semibold truncate">
                {upcomingAppointment.business.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {upcomingAppointment.service.name}
              </p>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5 shrink-0" />
                {format(
                  new Date(upcomingAppointment.requestedDate),
                  "d MMMM yyyy",
                  { locale: tr }
                )}
              </div>
            </div>
            <Link
              href="/account/appointments"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Görüntüle
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div className="space-y-1">
              <p className="font-medium">Yaklaşan randevu yok</p>
              <p className="text-sm text-muted-foreground">
                Bir işletme keşfederek ilk randevunuzu oluşturun.
              </p>
            </div>
            <Link
              href="/explore"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Keşfet
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stat summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold">{appointments.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Randevu</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold">{favoritesCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Favori</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold">{reviews.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Yorum</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold">{savedPostsCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Kayıtlı Gönderi</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile shortcut */}
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <Avatar className="size-12">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={displayName} />
            )}
            <AvatarFallback className="text-base">{initials || "U"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
          <Link
            href="/account/profile"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Düzenle
            <ArrowRight className="size-3.5" />
          </Link>
        </CardContent>
      </Card>

    </div>
  );
}
