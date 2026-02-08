import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, History, Stethoscope, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const navigate = useNavigate();
  const { doctor } = useDiagnosis();
  const { user } = useAuth();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Doctor";

  return (
    <AppLayout currentStep={1}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Welcome, {firstName}
          </h1>
          <p className="text-muted-foreground">
            Choose your workflow to begin
          </p>
        </div>

        {/* Doctor config status */}
        {doctor && (
          <div className="mb-6 p-4 bg-accent/50 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Active AI Profile:</span>{" "}
              {doctor.designation} ({doctor.degree}) — {doctor.specialization}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start New Diagnosis */}
          <button
            onClick={() => navigate("/build-doctor")}
            className="clinical-card p-8 text-left hover:shadow-lg transition-all duration-200 hover:border-primary/30 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <PlusCircle className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Start New Diagnosis
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Configure AI profile, enter patient data, and generate diagnostic assessment
            </p>
            <span className="inline-flex items-center text-sm font-medium text-primary">
              Begin <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </button>

          {/* View Past Diagnoses */}
          <button
            onClick={() => navigate("/history")}
            className="clinical-card p-8 text-left hover:shadow-lg transition-all duration-200 hover:border-primary/30 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center mb-4 group-hover:bg-secondary transition-colors">
              <History className="w-6 h-6 text-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              View Past Diagnoses
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Access saved diagnostic reports referenced by token ID
            </p>
            <span className="inline-flex items-center text-sm font-medium text-primary">
              View History <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
