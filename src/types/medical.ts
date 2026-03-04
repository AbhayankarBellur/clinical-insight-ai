export type DiagnosisMode = "pre" | "detailed" | "research";

export interface DoctorConfig {
  designation: string;
  customDesignation?: string;
  degree: string;
  customDegree?: string;
  specialization: string;
  customSpecialization?: string;
}

export interface PatientData {
  age: number;
  gender: string;
  nationality: string;
  weight: number;
  height: number;
  physicalAttributes: string;
  bp: string;
  o2: number;
  symptoms: string;
  history: string;
  examinationFindings: string;
  // Allergies & Sensitivities
  drugAllergies: string;
  foodAllergies: string;
  environmentalAllergies: string;
  // Current & Recent Medications
  currentMedications: string;
  recentlyStoppedMedications: string;
  // Ongoing / Past Treatments
  currentTreatments: string;
  pastTreatments: string;
  // Research Mode Fields (optional)
  familyMedicalHistory?: string;
  geneticConditions?: string;
  epidemiologicalExposure?: string;
  travelHistory?: string;
  occupationalExposure?: string;
  immunizationHistory?: string;
  previousLabResults?: string;
  imagingFindings?: string;
  specialistOpinions?: string;
  researchNotes?: string;
  // Diagnostic Imaging Upload (detailed + research modes only — NOT persisted to DB)
  imagingType?: string;
  imagingDescriptor?: string;
  imagingImageBase64?: string;
}

export type SectionKey = "primaryDiagnosis" | "investigativeTests" | "medication" | "furtherProcedures" | "imageAnalysis";

export interface SectionState {
  output: string;
  reasoning: string;
}

export interface DiagnosisResult {
  primaryDiagnosis: string;
  primaryDiagnosisReasoning: string;
  investigativeTests: string;
  investigativeTestsReasoning: string;
  medication: string;
  medicationReasoning: string;
  furtherProcedures: string;
  furtherProceduresReasoning: string;
  imageAnalysis: string;
  imageAnalysisReasoning: string;
  rawResponse: string;
}

export interface DiagnosisState {
  result: DiagnosisResult;
  sections: Record<SectionKey, SectionState>;
  mode: DiagnosisMode;
}
