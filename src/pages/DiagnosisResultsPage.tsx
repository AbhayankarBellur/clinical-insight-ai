import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DiagnosisResults } from "@/components/results/DiagnosisResults";
import { useDiagnosis } from "@/context/DiagnosisContext";

export default function DiagnosisResultsPage() {
  const navigate = useNavigate();
  const { 
    diagnosis, 
    diagnosisState,
    doctor, 
    patient, 
    resetPatient, 
    resetAll,
  } = useDiagnosis();

  // Redirect if no diagnosis available
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
    navigate("/");
  };

  return (
    <AppLayout currentStep={3}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Test Your Intuition
          </h1>
          <p className="text-muted-foreground">
            AI-generated diagnostic assessment based on clinical data
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">AI Doctor</p>
              <p className="text-sm text-foreground">
                {doctor.designation} ({doctor.degree})
              </p>
            </div>
            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Patient</p>
              <p className="text-sm text-foreground">
                {patient.age}y {patient.gender} — BP: {patient.bp}, O2: {patient.o2}%
              </p>
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
        />
      </div>
    </AppLayout>
  );
}
