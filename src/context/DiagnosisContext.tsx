import { createContext, useContext, useState, ReactNode } from "react";
import { DoctorConfig, PatientData, DiagnosisResult } from "@/types/medical";

interface DiagnosisContextType {
  doctor: DoctorConfig | null;
  setDoctor: (doctor: DoctorConfig) => void;
  patient: PatientData | null;
  setPatient: (patient: PatientData) => void;
  diagnosis: DiagnosisResult | null;
  setDiagnosis: (diagnosis: DiagnosisResult) => void;
  resetPatient: () => void;
  resetAll: () => void;
}

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(undefined);

export function DiagnosisProvider({ children }: { children: ReactNode }) {
  const [doctor, setDoctor] = useState<DoctorConfig | null>(null);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  const resetPatient = () => {
    setPatient(null);
    setDiagnosis(null);
  };

  const resetAll = () => {
    setDoctor(null);
    setPatient(null);
    setDiagnosis(null);
  };

  return (
    <DiagnosisContext.Provider
      value={{
        doctor,
        setDoctor,
        patient,
        setPatient,
        diagnosis,
        setDiagnosis,
        resetPatient,
        resetAll,
      }}
    >
      {children}
    </DiagnosisContext.Provider>
  );
}

export function useDiagnosis() {
  const context = useContext(DiagnosisContext);
  if (!context) {
    throw new Error("useDiagnosis must be used within DiagnosisProvider");
  }
  return context;
}
