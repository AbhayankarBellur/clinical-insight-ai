import { DiagnosisResult } from "@/types/medical";

/**
 * Parse the structured diagnosis response from the LLM.
 * Expected format for each section:
 * 
 * PRIMARY DIAGNOSIS:
 * Output: ...
 * Reasoning: ...
 * 
 * INVESTIGATIVE TESTS:
 * Output: ...
 * Reasoning: ...
 * 
 * MEDICATION:
 * Output: ...
 * Reasoning: ...
 * 
 * FURTHER PROCEDURES:
 * Output: ...
 * Reasoning: ...
 */
export function parseDiagnosis(response: string): DiagnosisResult {
  const result: DiagnosisResult = {
    primaryDiagnosis: "",
    primaryDiagnosisReasoning: "",
    investigativeTests: "",
    investigativeTestsReasoning: "",
    medication: "",
    medicationReasoning: "",
    furtherProcedures: "",
    furtherProceduresReasoning: "",
    rawResponse: response,
  };

  // Extract each main section
  const sections = {
    primaryDiagnosis: extractSection(response, "PRIMARY DIAGNOSIS", "INVESTIGATIVE TESTS"),
    investigativeTests: extractSection(response, "INVESTIGATIVE TESTS", "MEDICATION"),
    medication: extractSection(response, "MEDICATION", "FURTHER PROCEDURES"),
    furtherProcedures: extractSection(response, "FURTHER PROCEDURES", null),
  };

  // Parse output and reasoning from each section
  for (const [key, content] of Object.entries(sections)) {
    if (content) {
      const { output, reasoning } = parseOutputAndReasoning(content);
      if (key === "primaryDiagnosis") {
        result.primaryDiagnosis = output;
        result.primaryDiagnosisReasoning = reasoning;
      } else if (key === "investigativeTests") {
        result.investigativeTests = output;
        result.investigativeTestsReasoning = reasoning;
      } else if (key === "medication") {
        result.medication = output;
        result.medicationReasoning = reasoning;
      } else if (key === "furtherProcedures") {
        result.furtherProcedures = output;
        result.furtherProceduresReasoning = reasoning;
      }
    }
  }

  return result;
}

/**
 * Extract content between two section markers
 */
function extractSection(text: string, startMarker: string, endMarker: string | null): string {
  // Create pattern for start marker (handles optional ## and :)
  const startPattern = new RegExp(`(?:##\\s*)?${startMarker}:?\\s*`, "i");
  const startMatch = text.match(startPattern);
  
  if (!startMatch) return "";
  
  const startIndex = startMatch.index! + startMatch[0].length;
  
  if (endMarker) {
    const endPattern = new RegExp(`(?:##\\s*)?${endMarker}:?`, "i");
    const remainingText = text.substring(startIndex);
    const endMatch = remainingText.match(endPattern);
    
    if (endMatch) {
      return remainingText.substring(0, endMatch.index).trim();
    }
  }
  
  return text.substring(startIndex).trim();
}

/**
 * Parse Output and Reasoning from a section's content
 * Expected format:
 * Output: <content>
 * Reasoning: <content>
 * 
 * Falls back to treating entire content as output if markers not found
 */
function parseOutputAndReasoning(content: string): { output: string; reasoning: string } {
  // Try to find explicit Output: and Reasoning: markers
  const outputMatch = content.match(/Output:\s*([\s\S]*?)(?=Reasoning:|$)/i);
  const reasoningMatch = content.match(/Reasoning:\s*([\s\S]*?)$/i);

  if (outputMatch && reasoningMatch) {
    return {
      output: outputMatch[1].trim(),
      reasoning: reasoningMatch[1].trim(),
    };
  }

  // Fallback: if no markers found, entire content is output
  // This handles backward compatibility with older format
  return {
    output: content.trim(),
    reasoning: "",
  };
}
