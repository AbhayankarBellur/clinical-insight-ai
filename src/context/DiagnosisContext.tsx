import { createContext, useContext, useState, ReactNode } from "react";
import { DoctorConfig, PatientData, DiagnosisResult, DiagnosisMode, DiagnosisState, SectionKey, SectionState } from "@/types/medical";

interface DiagnosisContextType {
  doctor: DoctorConfig | null;
  setDoctor: (doctor: DoctorConfig) => void;
  patient: PatientData | null;
  setPatient: (patient: PatientData) => void;
  diagnosisState: DiagnosisState | null;
  setDiagnosisResult: (result: DiagnosisResult, mode: DiagnosisMode) => void;
  updateSectionOutput: (section: SectionKey, output: string) => void;
  updateSectionReasoning: (section: SectionKey, reasoning: string | null) => void;
  setSectionLoading: (section: SectionKey, type: "reasoning" | "edit", loading: boolean) => void;
  diagnosisMode: DiagnosisMode;
  setDiagnosisMode: (mode: DiagnosisMode) => void;
  resetPatient: () => void;
  resetAll: () => void;
  // Legacy getter for compatibility
  diagnosis: DiagnosisResult | null;
  setDiagnosis: (diagnosis: DiagnosisResult) => void;
}

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(undefined);

const createInitialSectionState = (output: string): SectionState => ({
  output,
  reasoning: null,
  isLoadingReasoning: false,
  isLoadingEdit: false,
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
        primaryDiagnosis: createInitialSectionState(result.primaryDiagnosis),
        investigativeTests: createInitialSectionState(result.investigativeTests),
        medication: createInitialSectionState(result.medication),
        furtherProcedures: createInitialSectionState(result.furtherProcedures),
      },
    });
  };

  const updateSectionOutput = (section: SectionKey, output: string) => {
    if (!diagnosisState) return;
    setDiagnosisState({
      ...diagnosisState,
      sections: {
        ...diagnosisState.sections,
        [section]: {
          ...diagnosisState.sections[section],
          output,
          reasoning: null, // Clear reasoning when output changes
        },
      },
    });
  };

  const updateSectionReasoning = (section: SectionKey, reasoning: string | null) => {
    if (!diagnosisState) return;
    setDiagnosisState({
      ...diagnosisState,
      sections: {
        ...diagnosisState.sections,
        [section]: {
          ...diagnosisState.sections[section],
          reasoning,
        },
      },
    });
  };

  const setSectionLoading = (section: SectionKey, type: "reasoning" | "edit", loading: boolean) => {
    if (!diagnosisState) return;
    setDiagnosisState({
      ...diagnosisState,
      sections: {
        ...diagnosisState.sections,
        [section]: {
          ...diagnosisState.sections[section],
          [type === "reasoning" ? "isLoadingReasoning" : "isLoadingEdit"]: loading,
        },
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
        updateSectionOutput,
        updateSectionReasoning,
        setSectionLoading,
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
