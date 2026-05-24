import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Bell, Globe, Lock, LogOut } from "lucide-react";

export const metadata = { title: "Ayarlar" };

const comingSoonItems = [
  {
    icon: Bell,
    title: "Bildirimler",
    description: "E-posta ve SMS bildirim tercihlerinizi yönetin.",
  },
  {
    icon: Globe,
    title: "Dil",
    description: "Uygulama dilini seçin.",
  },
  {
    icon: Lock,
    title: "Gizlilik",
    description: "Hesap gizlilik ayarlarınızı düzenleyin.",
  },
];

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground">
          Hesap ve uygulama tercihlerinizi yönetin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hesap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Çıkış yap</p>
              <p className="text-sm text-muted-foreground">
                Hesabınızdan güvenli şekilde çıkış yapın.
              </p>
            </div>
            <SignOutButton>
              <Button variant="outline" size="sm">
                <LogOut className="mr-2 size-4" />
                Çıkış yap
              </Button>
            </SignOutButton>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tercihler</CardTitle>
          <CardDescription>Bu ayarlar yakında kullanıma açılacak.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {comingSoonItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <item.icon className="size-4 text-muted-foreground shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" disabled className="text-xs text-muted-foreground">
                Yakında
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
