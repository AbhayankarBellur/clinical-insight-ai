import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DoctorForm } from "@/components/forms/DoctorForm";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { DoctorConfig } from "@/types/medical";
import { useToast } from "@/hooks/use-toast";

export default function BuildDoctor() {
  const navigate = useNavigate();
  const { setDoctor, doctor } = useDiagnosis();
  const { savedProfile, saveProfile } = useDoctorProfile();
  const { toast } = useToast();

  const handleSubmit = async (data: DoctorConfig) => {
    setDoctor(data);
    // Also persist to profile
    const error = await saveProfile(data);
    if (error) {
      toast({ title: "Profile save failed", description: error.message, variant: "destructive" });
    }
    navigate("/patient");
  };

  return (
    <AppLayout currentStep={1}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            Build Your Intuition
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Configure the AI doctor profile to establish clinical expertise and approach
          </p>
        </div>

        <DoctorForm onSubmit={handleSubmit} defaultValues={doctor || savedProfile || undefined} />
      </div>
    </AppLayout>
  );
}
