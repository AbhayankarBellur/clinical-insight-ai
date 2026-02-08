import { supabase } from "@/integrations/supabase/client";
import { DiagnosisResult, DoctorConfig, PatientData, DiagnosisMode } from "@/types/medical";

/**
 * Extract top N items from a section output string.
 * Splits on numbered lines (e.g., "1.", "2.") and returns the first N.
 */
function extractTopItems(text: string, n = 2): string[] {
  if (!text) return [];
  // Try splitting by numbered lines
  const numbered = text.split(/\n/).filter((l) => /^\s*\d+[\.\)]/.test(l));
  if (numbered.length > 0) {
    return numbered.slice(0, n).map((l) => l.replace(/^\s*\d+[\.\)]\s*/, "").trim());
  }
  // Fallback: split by double newline or just take first N lines
  const lines = text.split(/\n+/).filter((l) => l.trim().length > 0);
  return lines.slice(0, n).map((l) => l.replace(/^\*+\s*/, "").trim());
}

/**
 * Generate a readable token ID: DX-YYYYMMDD-XXXX
 */
function generateTokenId(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DX-${date}-${rand}`;
}

export async function saveDiagnosis(
  result: DiagnosisResult,
  doctor: DoctorConfig,
  patient: PatientData,
  mode: DiagnosisMode
): Promise<{ token_id: string } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const token_id = generateTokenId();

  const patientSummary = {
    age: patient.age,
    gender: patient.gender,
    weight: patient.weight,
    bp: patient.bp,
    o2: patient.o2,
    symptoms: patient.symptoms.substring(0, 120),
  };

  const diagnosisData = {
    primaryDiagnosis: extractTopItems(result.primaryDiagnosis, 2),
    investigativeTests: extractTopItems(result.investigativeTests, 2),
    medication: extractTopItems(result.medication, 2),
    furtherProcedures: extractTopItems(result.furtherProcedures, 2),
  };

  const doctorConfig = {
    designation: doctor.designation,
    degree: doctor.degree,
    specialization: doctor.specialization,
  };

  const { error } = await supabase.from("saved_diagnoses").insert({
    user_id: user.id,
    token_id,
    doctor_config: doctorConfig,
    patient_summary: patientSummary,
    diagnosis_data: diagnosisData,
    diagnosis_mode: mode,
  });

  if (error) return { error: error.message };
  return { token_id };
}
