import { DiagnosisMode } from "@/types/medical";
import { cn } from "@/lib/utils";
import { Zap, FileText, Microscope } from "lucide-react";

interface DiagnosisModeSelectorProps {
  value: DiagnosisMode;
  onChange: (mode: DiagnosisMode) => void;
}

const modeConfig: Record<DiagnosisMode, { label: string; description: string; icon: typeof Zap; tagLabel: string }> = {
  pre: {
    label: "Pre-Diagnosis",
    description: "Quick triage • Minimal fields • Top 3 conditions",
    icon: Zap,
    tagLabel: "Fast",
  },
  detailed: {
    label: "Detailed Diagnosis",
    description: "Full assessment • Standard clinical workflow",
    icon: FileText,
    tagLabel: "Standard",
  },
  research: {
    label: "Diagnostic Research",
    description: "Extended analysis • Rare conditions • Academic depth",
    icon: Microscope,
    tagLabel: "Deep",
  },
};

export function DiagnosisModeSelector({ value, onChange }: DiagnosisModeSelectorProps) {
  return (
    <div className="clinical-card p-5 mb-6 rounded-xl">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 block">
        Diagnosis Mode
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.keys(modeConfig) as DiagnosisMode[]).map((mode) => {
          const config = modeConfig[mode];
          const Icon = config.icon;
          const isActive = value === mode;

          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              className={cn(
                "relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left group",
                isActive
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 bg-card hover:shadow-sm"
              )}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    isActive ? "bg-primary/15" : "bg-muted"
                  )}>
                    <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <span className={cn(
                    "font-semibold text-sm",
                    isActive ? "text-primary" : "text-foreground"
                  )}>
                    {config.label}
                  </span>
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {config.tagLabel}
                </span>
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed pl-10">
                {config.description}
              </span>
              {isActive && (
                <div className="absolute -top-px -left-px -right-px h-1 bg-primary rounded-t-xl" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}