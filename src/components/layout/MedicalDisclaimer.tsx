import { AlertTriangle } from "lucide-react";

export function MedicalDisclaimer() {
  return (
    <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg border border-border">
      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Medical Disclaimer:</strong> This AI-powered tool 
        is intended for informational and decision-support purposes only. It does not replace 
        professional medical judgment. All diagnoses and treatment plans must be validated by 
        a licensed medical practitioner. The healthcare provider assumes full responsibility 
        for patient care decisions.
      </p>
    </div>
  );
}
