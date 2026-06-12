import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/account/profile-form";
import { MapPin, ArrowRight, Star, Settings } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join("");

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "Profiliniz";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground">
          Kişisel bilgilerinizi güncelleyin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16" size="lg">
              {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={displayName} />
              )}
              <AvatarFallback className="text-xl">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-4">Kişisel Bilgiler</h3>
            <ProfileForm
              defaultValues={{
                firstName: user.firstName ?? "",
                lastName: user.lastName ?? "",
                phone: user.phone ?? "",
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="p-0 overflow-hidden divide-y divide-border">
        <Link href="/account/address" className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent/50">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-pink/10 text-brand-pink-foreground">
            <MapPin className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Hizmet Adresi</p>
            <p className="text-xs text-muted-foreground">
              {user.serviceAddress
                ? user.serviceAddress
                : "Eve veya konumunuza servis için adres ekleyin."}
            </p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0" />
        </Link>

        <Link href="/account/reviews" className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent/50">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-pink/10 text-brand-pink-foreground">
            <Star className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Yorumlarım</p>
            <p className="text-xs text-muted-foreground">
              Geçmiş randevularınız için bıraktığınız değerlendirmeler.
            </p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0" />
        </Link>

        <Link href="/account/settings" className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent/50">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-pink/10 text-brand-pink-foreground">
            <Settings className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Ayarlar</p>
            <p className="text-xs text-muted-foreground">
              Hesap ve bildirim tercihlerinizi yönetin.
            </p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0" />
        </Link>
      </Card>
    </div>
  );
}
