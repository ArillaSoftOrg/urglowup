import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddressForm } from "@/components/account/address-form";
import { MapPin } from "lucide-react";

export const metadata = { title: "Hizmet Adresi" };

export default async function AddressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hizmet Adresi</h1>
        <p className="text-muted-foreground">
          Eve veya konumunuza servis veren işletmeler için adresinizi kaydedin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-muted-foreground" />
            <CardTitle>Adresiniz</CardTitle>
          </div>
          <CardDescription>
            Bu bilgi isteğe bağlıdır. Yalnızca mobil veya ev hizmeti sunan işletmelerle
            çalışıyorsanız doldurun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddressForm defaultValue={user.serviceAddress ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
