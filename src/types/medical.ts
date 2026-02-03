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
}

export interface DiagnosisResult {
  primaryDiagnosis: string;
  investigativeTests: string;
  medication: string;
  furtherProcedures: string;
  rawResponse: string;
}
