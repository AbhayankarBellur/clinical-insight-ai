import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { Button } from "@/components/ui/button";
import { PlusCircle, History, ArrowRight, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const navigate = useNavigate();
  const { doctor, setDoctor } = useDiagnosis();
  const { user } = useAuth();
  const { savedProfile, loading: profileLoading } = useDoctorProfile();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Doctor";

  // Auto-load saved profile into context
  useEffect(() => {
    if (savedProfile && !doctor) {
      setDoctor(savedProfile);
    }
  }, [savedProfile, doctor, setDoctor]);

  const handleNewDiagnosis = () => {
    if (doctor || savedProfile) {
      // Profile exists — skip Build Doctor, go straight to patient form
      if (!doctor && savedProfile) setDoctor(savedProfile);
      navigate("/patient");
    } else {
      navigate("/build-doctor");
    }
  };

  return (
    <AppLayout currentStep={1}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            Welcome, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm">
            Choose your workflow to begin
          </p>
        </div>

        {/* Active config indicator */}
        {(doctor || savedProfile) && (
          <div className="mb-6 p-3 bg-accent/50 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Active AI Profile:</span>{" "}
              {(doctor || savedProfile)!.designation} ({(doctor || savedProfile)!.degree}) — {(doctor || savedProfile)!.specialization}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <button
            onClick={handleNewDiagnosis}
            className="clinical-card p-6 sm:p-8 text-left hover:shadow-lg transition-all duration-200 hover:border-primary/30 group cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
              <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              Start New Diagnosis
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              {doctor || savedProfile ? "Enter patient data and generate assessment" : "Configure AI profile, enter patient data, and diagnose"}
            </p>
            <span className="inline-flex items-center text-sm font-medium text-primary">
              Begin <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </button>

          <button
            onClick={() => navigate("/history")}
            className="clinical-card p-6 sm:p-8 text-left hover:shadow-lg transition-all duration-200 hover:border-primary/30 group cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary/80 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-secondary transition-colors">
              <History className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              View Past Diagnoses
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Access saved diagnostic reports referenced by token ID
            </p>
            <span className="inline-flex items-center text-sm font-medium text-primary">
              View History <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </button>
        </div>

        {/* 15-day purge disclaimer */}
        <div className="mt-8 p-3 bg-warning/5 border border-warning/20 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Data Retention Policy:</strong> All saved diagnoses are automatically purged after 15 days to ensure patient data privacy. Export or print any reports you wish to retain before expiry.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
