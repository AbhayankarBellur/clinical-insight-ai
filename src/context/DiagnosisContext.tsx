import { createContext, useContext, useState, ReactNode } from "react";
import { DoctorConfig, PatientData, DiagnosisResult, DiagnosisMode, DiagnosisState, SectionKey, SectionState } from "@/types/medical";

interface DiagnosisContextType {
  doctor: DoctorConfig | null;
  setDoctor: (doctor: DoctorConfig) => void;
  patient: PatientData | null;
  setPatient: (patient: PatientData) => void;
  diagnosisState: DiagnosisState | null;
  setDiagnosisResult: (result: DiagnosisResult, mode: DiagnosisMode) => void;
  diagnosisMode: DiagnosisMode;
  setDiagnosisMode: (mode: DiagnosisMode) => void;
  resetPatient: () => void;
  resetAll: () => void;
  // Legacy getter for compatibility
  diagnosis: DiagnosisResult | null;
  setDiagnosis: (diagnosis: DiagnosisResult) => void;
}

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(undefined);

const createSectionState = (output: string, reasoning: string): SectionState => ({
  output,
  reasoning,
});

export function DiagnosisProvider({ children }: { children: ReactNode }) {
  const [doctor, setDoctor] = useState<DoctorConfig | null>(null);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [diagnosisState, setDiagnosisState] = useState<DiagnosisState | null>(null);
  const [diagnosisMode, setDiagnosisMode] = useState<DiagnosisMode>("detailed");

  const setDiagnosisResult = (result: DiagnosisResult, mode: DiagnosisMode) => {
    setDiagnosisState({
      result,
      mode,
      sections: {
        primaryDiagnosis: createSectionState(result.primaryDiagnosis, result.primaryDiagnosisReasoning),
        investigativeTests: createSectionState(result.investigativeTests, result.investigativeTestsReasoning),
        medication: createSectionState(result.medication, result.medicationReasoning),
        furtherProcedures: createSectionState(result.furtherProcedures, result.furtherProceduresReasoning),
        imageAnalysis: createSectionState(result.imageAnalysis, result.imageAnalysisReasoning),
      },
    });
  };

  const resetPatient = () => {
    setPatient(null);
    setDiagnosisState(null);
  };

  const resetAll = () => {
    setDoctor(null);
    setPatient(null);
    setDiagnosisState(null);
    setDiagnosisMode("detailed");
  };

  // Legacy compatibility
  const diagnosis = diagnosisState?.result ?? null;
  const setDiagnosis = (result: DiagnosisResult) => {
    setDiagnosisResult(result, diagnosisMode);
  };

  return (
    <DiagnosisContext.Provider
      value={{
        doctor,
        setDoctor,
        patient,
        setPatient,
        diagnosisState,
        setDiagnosisResult,
        diagnosisMode,
        setDiagnosisMode,
        resetPatient,
        resetAll,
        diagnosis,
        setDiagnosis,
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
