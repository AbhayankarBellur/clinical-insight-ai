import { DiagnosisMode } from "@/types/medical";
import { cn } from "@/lib/utils";
import { Zap, FileText, Microscope } from "lucide-react";

interface DiagnosisModeSelectorProps {
  value: DiagnosisMode;
  onChange: (mode: DiagnosisMode) => void;
}

const modeConfig: Record<DiagnosisMode, { label: string; description: string; icon: typeof Zap }> = {
  pre: {
    label: "Pre-Diagnosis",
    description: "Quick triage • Minimal fields • Top 3 conditions",
    icon: Zap,
  },
  detailed: {
    label: "Detailed Diagnosis",
    description: "Full assessment • Standard clinical workflow",
    icon: FileText,
  },
  research: {
    label: "Diagnostic Research",
    description: "Extended analysis • Rare conditions • Academic depth",
    icon: Microscope,
  },
};

export function DiagnosisModeSelector({ value, onChange }: DiagnosisModeSelectorProps) {
  return (
    <div className="clinical-card p-4 mb-6">
      <label className="text-sm font-medium text-foreground mb-3 block">
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
                "flex flex-col items-start p-4 rounded-lg border-2 transition-all text-left",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50 bg-background"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("font-medium", isActive ? "text-primary" : "text-foreground")}>
                  {config.label}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{config.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
