import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin } from "lucide-react";

export function GoogleReviewsPlaceholder({
  googlePlaceId,
}: {
  googlePlaceId: string | null;
}) {
  if (!googlePlaceId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="size-4" />
          Google Reviews
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Google review integration coming soon.
        </p>
      </CardContent>
    </Card>
  );
}
