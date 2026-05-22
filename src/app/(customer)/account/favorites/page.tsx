import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heart } from "lucide-react";

export const metadata = { title: "Favorilerim" };

export default function FavoritesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Favorilerim</h1>
        <p className="text-muted-foreground">
          Daha sonra için kaydettiğiniz işletmeler.
        </p>
      </div>

      <Card>
        <CardHeader className="items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart className="size-6" />
          </div>
          <CardTitle>Henüz favori yok</CardTitle>
          <CardDescription className="max-w-sm">
            Bir işletmeyi favorilediğinizde buraya eklenecek ve kolayca tekrar bulabileceksiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            İşletmeleri keşfet
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
