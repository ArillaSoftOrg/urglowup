import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heart } from "lucide-react";

export const metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
        <p className="text-muted-foreground">
          Businesses you&apos;ve saved for later.
        </p>
      </div>

      <Card>
        <CardHeader className="items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart className="size-6" />
          </div>
          <CardTitle>No favorites yet</CardTitle>
          <CardDescription className="max-w-sm">
            When you favorite a business, it will appear here so you can quickly
            find it again.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Discover businesses
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
