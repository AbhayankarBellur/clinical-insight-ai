import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DiagnosisResults } from "@/components/results/DiagnosisResults";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { saveDiagnosis } from "@/lib/diagnosisStorage";
import { useToast } from "@/hooks/use-toast";

export default function DiagnosisResultsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    diagnosis,
    diagnosisState,
    doctor,
    patient,
    diagnosisMode,
    resetPatient,
    resetAll,
  } = useDiagnosis();
  const [saving, setSaving] = useState(false);
  const [savedToken, setSavedToken] = useState<string | null>(null);

  if (!diagnosis || !doctor || !patient) {
    navigate("/");
    return null;
  }

  const handleNewPatient = () => {
    resetPatient();
    navigate("/patient");
  };

  const handleReconfigure = () => {
    resetAll();
    navigate("/build-doctor");
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveDiagnosis(diagnosis, doctor, patient, diagnosisMode);
    setSaving(false);

    if ("error" in result) {
      toast({ title: "Save Failed", description: result.error, variant: "destructive" });
    } else {
      setSavedToken(result.token_id);
      toast({ title: "Diagnosis Saved", description: `Token: ${result.token_id}` });
    }
  };

  return (
    <AppLayout currentStep={3}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Test Your Intuition</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">AI-generated diagnostic assessment based on clinical data</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 sm:p-4 bg-accent/50 rounded-xl border border-border">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">AI Doctor</p>
              <p className="text-xs sm:text-sm font-medium text-foreground">{doctor.designation} ({doctor.degree})</p>
            </div>
            <div className="p-3 sm:p-4 bg-accent/50 rounded-xl border border-border">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Patient</p>
              <p className="text-xs sm:text-sm font-medium text-foreground">{patient.age}y {patient.gender} — BP: {patient.bp}, O2: {patient.o2}%</p>
            </div>
          </div>
        </div>

        <DiagnosisResults
          result={diagnosis}
          diagnosisState={diagnosisState}
          doctor={doctor}
          patient={patient}
          onNewPatient={handleNewPatient}
          onReconfigure={handleReconfigure}
          onSave={handleSave}
          saving={saving}
          savedToken={savedToken}
        />
      </div>
    </AppLayout>
  );
}
