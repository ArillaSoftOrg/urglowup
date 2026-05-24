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
import { ProfileForm } from "@/components/account/profile-form";
import { MapPin, ArrowRight } from "lucide-react";
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground">
          Kişisel bilgilerinizi güncelleyin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fotoğraf</CardTitle>
          <CardDescription>Giriş sağlayıcınızdan gelen profil fotoğrafınız.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
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
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Kişisel Bilgiler</CardTitle>
          <CardDescription>
            Ad ve iletişim bilgilerinizi güncelleyin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultValues={{
              firstName: user.firstName ?? "",
              lastName: user.lastName ?? "",
              phone: user.phone ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Link href="/account/address" className="group block">
        <Card className="transition-colors group-hover:bg-accent/50">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
