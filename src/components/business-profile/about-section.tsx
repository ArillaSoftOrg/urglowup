import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BusinessWithDetails } from "@/lib/queries/business";

export function AboutSection({ business }: { business: BusinessWithDetails }) {
  if (!business.description) return null;

  return (
    <Card className="bg-surface-cream">
      <CardHeader>
        <CardTitle>Hakkında</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {business.description}
        </p>
      </CardContent>
    </Card>
  );
}
