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
    </div>
  );
}
