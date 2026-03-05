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
import { useAuth } from "@/hooks/useAuth";
import { useDailyRequestUsage } from "@/hooks/useDailyRequestUsage";

export default function PatientSummary() {
  const navigate = useNavigate();
  const { doctor, setPatient, setDiagnosisResult, diagnosisMode } = useDiagnosis();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<DiagnosisMode>(diagnosisMode);
  const { refetch: refetchUsage } = useDailyRequestUsage();

  if (!doctor) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (data: PatientData, formMode: DiagnosisMode) => {
    setIsLoading(true);
    setPatient(data);

    try {
      // Atomically check + increment rate limit before calling AI
      if (user) {
        const { data: limitResult, error: limitError } = await supabase.rpc(
          "check_and_increment_daily_request",
          { _user_id: user.id }
        );
        if (limitError) throw limitError;
        const limit = limitResult as { allowed: boolean; remaining: number };
        if (!limit.allowed) {
          toast({
            title: "Daily Limit Reached",
            description: "You have used all 5 diagnoses for today. Your quota resets at 12:00 AM IST.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      const { data: response, error } = await supabase.functions.invoke("diagnose", {
        body: { doctor, patient: data, mode },
      });

      if (error) throw error;
      if (response.error) throw new Error(response.error);

      const parsedResult = parseDiagnosis(response.diagnosis);
      setDiagnosisResult(parsedResult, mode);
      refetchUsage(); // Refresh dashboard counter
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
    navigate("/build-doctor");
  };

  return (
    <AppLayout currentStep={2}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            Refine Your Intuition
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Enter comprehensive patient data for diagnostic analysis
          </p>
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-accent/50 rounded-xl border border-border">
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-medium text-foreground">AI Doctor Profile:</span>{" "}
              {doctor.designation} ({doctor.degree}) — {doctor.specialization}
            </p>
          </div>
        </div>

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
          <div className="clinical-card p-6 sm:p-8 text-center max-w-md rounded-2xl shadow-lg mx-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              Analyzing Clinical Data
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Processing patient information and generating diagnostic assessment...
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
