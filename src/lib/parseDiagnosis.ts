import { DiagnosisResult } from "@/types/medical";

export function parseDiagnosis(response: string): DiagnosisResult {
  const result: DiagnosisResult = {
    primaryDiagnosis: "",
    investigativeTests: "",
    medication: "",
    furtherProcedures: "",
    rawResponse: response,
  };

  // Extract PRIMARY DIAGNOSIS section
  const diagnosisMatch = response.match(
    /PRIMARY DIAGNOSIS:\s*([\s\S]*?)(?=INVESTIGATIVE TESTS:|$)/i
  );
  if (diagnosisMatch) {
    result.primaryDiagnosis = diagnosisMatch[1].trim();
  }

  // Extract INVESTIGATIVE TESTS section
  const testsMatch = response.match(
    /INVESTIGATIVE TESTS:\s*([\s\S]*?)(?=MEDICATION:|$)/i
  );
  if (testsMatch) {
    result.investigativeTests = testsMatch[1].trim();
  }

  // Extract MEDICATION section
  const medicationMatch = response.match(
    /MEDICATION:\s*([\s\S]*?)(?=FURTHER PROCEDURES:|$)/i
  );
  if (medicationMatch) {
    result.medication = medicationMatch[1].trim();
  }

  // Extract FURTHER PROCEDURES section
  const proceduresMatch = response.match(
    /FURTHER PROCEDURES:\s*([\s\S]*?)$/i
  );
  if (proceduresMatch) {
    result.furtherProcedures = proceduresMatch[1].trim();
  }

  return result;
}
