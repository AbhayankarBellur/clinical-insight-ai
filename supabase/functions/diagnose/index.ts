import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DoctorConfig {
  designation: string;
  degree: string;
  specialization: string;
}

interface PatientData {
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
  drugAllergies: string;
  foodAllergies: string;
  environmentalAllergies: string;
  currentMedications: string;
  recentlyStoppedMedications: string;
  currentTreatments: string;
  pastTreatments: string;
  // Research fields
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
}

type DiagnosisMode = "pre" | "detailed" | "research";

// Mode-specific prompt modifiers
const getModeModifier = (mode: DiagnosisMode): string => {
  switch (mode) {
    case "pre":
      return `
QUICK TRIAGE MODE:
- Provide concise differential diagnosis
- Limit to top 3 conditions with probability percentages
- Focus on immediate safety and direction
- Avoid verbose rationale
- Prioritize red flags and urgent conditions`;
    
    case "research":
      return `
DIAGNOSTIC RESEARCH MODE:
- Provide extended differential diagnosis including rare conditions
- Correlate epidemiological and genetic factors
- Expand investigative and pathophysiological reasoning
- Include uncommon but plausible conditions
- Consider academic/specialist-level analysis`;
    
    default:
      return `
DETAILED DIAGNOSIS MODE:
- Provide comprehensive differential diagnosis with probability percentages
- Expand investigation rationale
- Consider contraindications and comorbidities
- Balance thoroughness with clinical practicality`;
  }
};

// Prune empty fields to reduce tokens
const pruneEmptyFields = (obj: Record<string, unknown>): Record<string, unknown> => {
  const pruned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== "" && value !== 0) {
      pruned[key] = value;
    }
  }
  return pruned;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { doctor, patient, mode = "detailed" } = await req.json() as { 
      doctor: DoctorConfig; 
      patient: PatientData;
      mode?: DiagnosisMode;
    };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Lovable API key not configured");
    }

    const modeModifier = getModeModifier(mode);

    const systemPrompt = `You are a ${doctor.designation} with ${doctor.degree} specializing in ${doctor.specialization}. 

You follow these universal standard operating procedures for all clinical assessments:

CLINICAL EXAMINATION PROTOCOL:
1. Comprehensive patient assessment using systematic review of systems
2. Evidence-based diagnostic reasoning with differential diagnosis generation
3. Red flag identification and prioritization of life-threatening conditions
4. Investigation planning from least to most invasive
5. Evidence-based treatment aligned with current clinical guidelines
6. Patient safety verification including drug interactions and contraindications
7. Appropriate specialist referral and follow-up planning

CRITICAL SAFETY INSTRUCTIONS:
- Always check allergies, current medications, and ongoing treatments before recommending any drugs
- Avoid contraindicated medications based on patient's allergy profile
- Consider drug-drug interactions with current medications
- Account for ongoing treatments that may affect recommendations
${modeModifier}

Instructions:
- Analyze the patient data including examination findings provided by the examining physician
- Provide a structured diagnostic assessment following evidence-based clinical guidelines
- Consider patient-specific factors (age, nationality, physical attributes, examination findings)
- Ensure all recommendations align with current standard of care for your specialization
- For PRIMARY DIAGNOSIS: Provide a ranked differential diagnosis with probability percentages (e.g., "Condition A (65%)")

Respond ONLY in the following EXACT structure with no additional text, no markdown headers beyond these labels:

PRIMARY DIAGNOSIS:

INVESTIGATIVE TESTS:

MEDICATION:

FURTHER PROCEDURES:`;

    // Build context sections with pruning
    const prunedPatient = pruneEmptyFields(patient as unknown as Record<string, unknown>);

    const allergiesSection = [
      prunedPatient.drugAllergies && `Drug Allergies: ${prunedPatient.drugAllergies}`,
      prunedPatient.foodAllergies && `Food Allergies: ${prunedPatient.foodAllergies}`,
      prunedPatient.environmentalAllergies && `Environmental Allergies: ${prunedPatient.environmentalAllergies}`,
    ].filter(Boolean).join("\n") || "No known allergies reported";

    const medicationsSection = [
      prunedPatient.currentMedications && `Current Medications: ${prunedPatient.currentMedications}`,
      prunedPatient.recentlyStoppedMedications && `Recently Stopped: ${prunedPatient.recentlyStoppedMedications}`,
    ].filter(Boolean).join("\n") || "No current medications reported";

    const treatmentsSection = [
      prunedPatient.currentTreatments && `Current Treatments: ${prunedPatient.currentTreatments}`,
      prunedPatient.pastTreatments && `Past Treatments/Surgeries: ${prunedPatient.pastTreatments}`,
    ].filter(Boolean).join("\n") || "No ongoing treatments reported";

    // Research context (only in research mode)
    let researchSection = "";
    if (mode === "research") {
      const researchFields = [
        prunedPatient.familyMedicalHistory && `Family Medical History: ${prunedPatient.familyMedicalHistory}`,
        prunedPatient.geneticConditions && `Genetic Conditions: ${prunedPatient.geneticConditions}`,
        prunedPatient.epidemiologicalExposure && `Epidemiological Exposure: ${prunedPatient.epidemiologicalExposure}`,
        prunedPatient.travelHistory && `Travel History: ${prunedPatient.travelHistory}`,
        prunedPatient.occupationalExposure && `Occupational/Environmental Exposure: ${prunedPatient.occupationalExposure}`,
        prunedPatient.immunizationHistory && `Immunization History: ${prunedPatient.immunizationHistory}`,
        prunedPatient.previousLabResults && `Previous Lab Results: ${prunedPatient.previousLabResults}`,
        prunedPatient.imagingFindings && `Imaging Findings: ${prunedPatient.imagingFindings}`,
        prunedPatient.specialistOpinions && `Specialist Opinions: ${prunedPatient.specialistOpinions}`,
        prunedPatient.researchNotes && `Research Notes: ${prunedPatient.researchNotes}`,
      ].filter(Boolean);

      if (researchFields.length > 0) {
        researchSection = `\nRESEARCH CONTEXT:\n${researchFields.join("\n")}`;
      }
    }

    const userPrompt = `Analyze the following patient:

DEMOGRAPHICS:
Age: ${patient.age}, Gender: ${patient.gender}${patient.nationality ? `, Nationality: ${patient.nationality}` : ""}
Weight: ${patient.weight}kg${patient.height ? `, Height: ${patient.height}cm` : ""}
${patient.physicalAttributes ? `Physical Attributes: ${patient.physicalAttributes}` : ""}

VITALS:
Blood Pressure: ${patient.bp}, O2 Saturation: ${patient.o2}%

ALLERGIES & SENSITIVITIES:
${allergiesSection}

CURRENT & RECENT MEDICATIONS:
${medicationsSection}

ONGOING / PAST TREATMENTS:
${treatmentsSection}

PRIMARY EXAMINATION FINDINGS (Performed by Physician):
${patient.examinationFindings}

SYMPTOMS:
${patient.symptoms}

${patient.history ? `MEDICAL HISTORY:\n${patient.history}` : ""}
${researchSection}

Provide your response in EXACTLY this format with no additional text:

PRIMARY DIAGNOSIS:

INVESTIGATIVE TESTS:

MEDICATION:

FURTHER PROCEDURES:`;

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
        max_tokens: mode === "research" ? 4000 : mode === "pre" ? 1500 : 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid API key. Please check your configuration." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`Lovable AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ diagnosis: content, mode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Diagnosis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
