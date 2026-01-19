import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DoctorForm } from "@/components/forms/DoctorForm";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { DoctorConfig } from "@/types/medical";

export default function BuildDoctor() {
  const navigate = useNavigate();
  const { setDoctor, doctor } = useDiagnosis();

  const handleSubmit = (data: DoctorConfig) => {
    setDoctor(data);
    navigate("/patient");
  };

  return (
    <AppLayout currentStep={1}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Build Your Intuition
          </h1>
          <p className="text-muted-foreground">
            Configure the AI doctor profile to establish clinical expertise and approach
          </p>
        </div>

        <DoctorForm onSubmit={handleSubmit} defaultValues={doctor || undefined} />
      </div>
    </AppLayout>
  );
}
