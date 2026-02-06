import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PatientForm } from "@/components/forms/PatientForm";
import { DiagnosisModeSelector } from "@/components/forms/DiagnosisModeSelector";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { PatientData, DiagnosisMode } from "@/types/medical";
import { parseDiagnosis } from "@/lib/parseDiagnosis";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PatientSummary() {
  const navigate = useNavigate();
  const { doctor, setPatient, setDiagnosisResult, diagnosisMode } = useDiagnosis();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<DiagnosisMode>(diagnosisMode);

  // Redirect if no doctor configured
  if (!doctor) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (data: PatientData, formMode: DiagnosisMode) => {
    setIsLoading(true);
    setPatient(data);

    try {
      const { data: response, error } = await supabase.functions.invoke("diagnose", {
        body: { doctor, patient: data, mode },
      });

      if (error) {
        throw error;
      }

      if (response.error) {
        throw new Error(response.error);
      }

      const parsedResult = parseDiagnosis(response.diagnosis);
      setDiagnosisResult(parsedResult, mode);
      navigate("/results");
    } catch (error) {
      console.error("Diagnosis error:", error);
      toast({
        title: "Diagnosis Failed",
        description: error instanceof Error ? error.message : "Unable to process diagnosis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <AppLayout currentStep={2}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Refine Your Intuition
          </h1>
          <p className="text-muted-foreground">
            Enter comprehensive patient data for diagnostic analysis
          </p>
          <div className="mt-4 p-4 bg-accent/50 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">AI Doctor Profile:</span>{" "}
              {doctor.designation} ({doctor.degree}) — {doctor.specialization}
            </p>
          </div>
        </div>

        {/* Mode selector outside the form so form remounts with correct schema */}
        <DiagnosisModeSelector value={mode} onChange={setMode} />

        <PatientForm
          key={mode}
          onSubmit={handleSubmit}
          onBack={handleBack}
          isLoading={isLoading}
          initialMode={mode}
        />
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="clinical-card p-8 text-center max-w-md rounded-2xl shadow-lg">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Analyzing Clinical Data
            </h3>
            <p className="text-muted-foreground text-sm">
              Processing patient information and generating diagnostic assessment...
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}