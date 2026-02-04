import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SectionUpdateRequest {
  section: "primaryDiagnosis" | "investigativeTests" | "medication" | "furtherProcedures";
  editInstruction: string;
  fullDiagnosisText: string;
  doctorProfile: {
    designation: string;
    degree: string;
    specialization: string;
  };
  patientSummaryCompressed: {
    age: number;
    gender: string;
    symptoms: string;
    allergies?: string;
    currentMedications?: string;
  };
}

const sectionLabels: Record<string, string> = {
  primaryDiagnosis: "PRIMARY DIAGNOSIS",
  investigativeTests: "INVESTIGATIVE TESTS",
  medication: "MEDICATION",
  furtherProcedures: "FURTHER PROCEDURES",
};

// Context pruning based on section
const getPrunedContext = (
  section: string,
  patient: SectionUpdateRequest["patientSummaryCompressed"],
  diagnosis: string
): string => {
  switch (section) {
    case "primaryDiagnosis":
      return `Age: ${patient.age}, Gender: ${patient.gender}\nSymptoms: ${patient.symptoms}`;
    case "investigativeTests":
      return `Age: ${patient.age}, Gender: ${patient.gender}\nPrimary Diagnosis: ${diagnosis}`;
    case "medication":
      return `Age: ${patient.age}, Gender: ${patient.gender}\nAllergies: ${patient.allergies || "None reported"}\nCurrent Medications: ${patient.currentMedications || "None"}\nDiagnosis: ${diagnosis}`;
    case "furtherProcedures":
      return `Age: ${patient.age}, Gender: ${patient.gender}\nDiagnosis: ${diagnosis}`;
    default:
      return `Age: ${patient.age}, Gender: ${patient.gender}`;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      section, 
      editInstruction, 
      fullDiagnosisText, 
      doctorProfile, 
      patientSummaryCompressed 
    } = await req.json() as SectionUpdateRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Lovable API key not configured");
    }

    const sectionLabel = sectionLabels[section] || section;
    
    // Extract current diagnosis from full text for context
    const diagnosisMatch = fullDiagnosisText.match(/PRIMARY DIAGNOSIS:\s*([\s\S]*?)(?=INVESTIGATIVE TESTS:|$)/i);
    const currentDiagnosis = diagnosisMatch?.[1]?.trim() || "";

    const prunedContext = getPrunedContext(section, patientSummaryCompressed, currentDiagnosis);

    const systemPrompt = `You are a ${doctorProfile.designation} with ${doctorProfile.degree} specializing in ${doctorProfile.specialization}.

Your task is to revise ONLY the ${sectionLabel} section of a clinical report based on the doctor's instruction.

Rules:
- Revise ONLY the ${sectionLabel} section
- Maintain logical consistency with the overall diagnosis
- If revising PRIMARY DIAGNOSIS, recalculate probability percentages
- Output ONLY the revised section text
- Do NOT include the section label in your response
- Do NOT include any other sections
- Do NOT add explanations or commentary`;

    const userPrompt = `Patient Context (Pruned):
${prunedContext}

Current Full Diagnosis:
${fullDiagnosisText}

Doctor's Instruction for ${sectionLabel}:
${editInstruction}

Provide the revised ${sectionLabel} content only:`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Section update API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const updatedContent = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ updatedContent, section }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Section update error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
