export interface DoctorConfig {
  designation: string;
  degree: string;
  specialization: string;
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
}

export interface DiagnosisResult {
  primaryDiagnosis: string;
  investigativeTests: string;
  medication: string;
  furtherProcedures: string;
  rawResponse: string;
}
