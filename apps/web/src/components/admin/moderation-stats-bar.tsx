import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Clock } from "lucide-react";

interface ModerationStatsBarProps {
  stats: {
    total: number;
    urgent: number;
    elevated: number;
    pending: number;
  };
}

export function ModerationStatsBar({ stats }: ModerationStatsBarProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold">{stats.urgent}</p>
              <p className="text-xs text-muted-foreground">Urgent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-orange-600" />
            <div>
              <p className="text-2xl font-bold">{stats.elevated}</p>
              <p className="text-xs text-muted-foreground">Elevated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-slate-600" />
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Normal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Total in Queue</p>
        </CardContent>
      </Card>
    </div>
  );
}
