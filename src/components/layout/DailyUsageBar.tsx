import { Clock, Zap } from "lucide-react";
import { DailyUsage } from "@/hooks/useDailyRequestUsage";

interface DailyUsageBarProps {
  usage: DailyUsage;
}

function formatISTReset(resetUtc: string): string {
  // The reset is always IST midnight — just display "12:00 AM IST"
  return "12:00 AM IST";
}

export function DailyUsageBar({ usage }: DailyUsageBarProps) {
  const pct = Math.round((usage.count / usage.limit) * 100);
  const exhausted = usage.remaining === 0;
  const oneLeft = usage.remaining === 1;

  const barColor = exhausted
    ? "bg-destructive"
    : oneLeft
    ? "bg-warning"
    : "bg-primary";

  const labelColor = exhausted
    ? "text-destructive"
    : oneLeft
    ? "text-warning"
    : "text-primary";

  return (
    <div className="mb-6 p-4 clinical-card rounded-xl border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Daily Diagnoses
          </span>
        </div>
        <span className={`text-sm font-semibold ${labelColor}`}>
          {usage.count} / {usage.limit} used
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {exhausted ? (
            <span className="text-destructive font-medium">
              Limit reached — no requests remaining today
            </span>
          ) : (
            <>
              <span className={`font-medium ${labelColor}`}>
                {usage.remaining} request{usage.remaining !== 1 ? "s" : ""}
              </span>{" "}
              remaining today
            </>
          )}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Resets at {formatISTReset(usage.reset_at_utc)}
        </span>
      </div>
    </div>
  );
}
