import { DiagnosisResult } from "@/types/medical";

/**
 * Parse the structured diagnosis response from the LLM.
 * Uses strict line-start matching to prevent content bleeding between sections.
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

  // Normalize separators if present (--- SECTION --- format)
  const normalized = response
    .replace(/---\s*/g, "")
    .replace(/\s*---/g, "");

  // Extract each main section using line-start anchored patterns
  const sections = {
    primaryDiagnosis: extractSection(normalized, "PRIMARY DIAGNOSIS", ["INVESTIGATIVE TESTS"]),
    investigativeTests: extractSection(normalized, "INVESTIGATIVE TESTS", ["MEDICATION"]),
    medication: extractSection(normalized, "MEDICATION", ["FURTHER PROCEDURES"]),
    furtherProcedures: extractSection(normalized, "FURTHER PROCEDURES", []),
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
 * Extract content between two section markers.
 * Uses line-start anchoring to prevent matching section names embedded in content.
 */
function extractSection(text: string, startMarker: string, endMarkers: string[]): string {
  // Match marker at start of line, with optional ##, **, whitespace, and colon
  const startPattern = new RegExp(
    `(?:^|\\n)\\s*(?:#{1,3}\\s*)?(?:\\*{0,2})\\s*${escapeRegex(startMarker)}\\s*(?:\\*{0,2})\\s*:?\\s*`,
    "i"
  );
  const startMatch = text.match(startPattern);
  
  if (!startMatch) return "";
  
  const startIndex = startMatch.index! + startMatch[0].length;
  const remainingText = text.substring(startIndex);
  
  if (endMarkers.length > 0) {
    // Find the earliest end marker that appears at the start of a line
    let earliestEnd = remainingText.length;
    
    for (const endMarker of endMarkers) {
      const endPattern = new RegExp(
        `(?:^|\\n)\\s*(?:#{1,3}\\s*)?(?:\\*{0,2})\\s*${escapeRegex(endMarker)}\\s*(?:\\*{0,2})\\s*:?`,
        "i"
      );
      const endMatch = remainingText.match(endPattern);
      if (endMatch && endMatch.index! < earliestEnd) {
        earliestEnd = endMatch.index!;
      }
    }
    
    return remainingText.substring(0, earliestEnd).trim();
  }
  
  return remainingText.trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parse Output and Reasoning from a section's content.
 * Strictly separates the two subfields to prevent content from one leaking into the other.
 */
function parseOutputAndReasoning(content: string): { output: string; reasoning: string } {
  // Match "Output:" at the start of a line
  const outputPattern = /(?:^|\n)\s*(?:\*{0,2})Output(?:\*{0,2})\s*:\s*/i;
  const reasoningPattern = /(?:^|\n)\s*(?:\*{0,2})Reasoning(?:\*{0,2})\s*:\s*/i;

  const outputMatch = content.match(outputPattern);
  const reasoningMatch = content.match(reasoningPattern);

  if (outputMatch && reasoningMatch) {
    const outputStart = outputMatch.index! + outputMatch[0].length;
    const reasoningStart = reasoningMatch.index! + reasoningMatch[0].length;
    
    // Output is everything between Output: and Reasoning:
    const outputEnd = reasoningMatch.index!;
    const output = content.substring(outputStart, outputEnd).trim();
    
    // Reasoning is everything after Reasoning: to the end
    const reasoning = content.substring(reasoningStart).trim();
    
    return { output, reasoning };
  }

  if (outputMatch && !reasoningMatch) {
    const outputStart = outputMatch.index! + outputMatch[0].length;
    return {
      output: content.substring(outputStart).trim(),
      reasoning: "",
    };
  }

  // Fallback: entire content is output
  return {
    output: content.trim(),
    reasoning: "",
  };
}