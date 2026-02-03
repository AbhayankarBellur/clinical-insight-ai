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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { doctor, patient } = await req.json() as { doctor: DoctorConfig; patient: PatientData };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Lovable API key not configured");
    }

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

Instructions:
- Analyze the patient data including examination findings provided by the examining physician
- Provide a structured diagnostic assessment following evidence-based clinical guidelines
- Consider patient-specific factors (age, nationality, physical attributes, examination findings)
- Ensure all recommendations align with current standard of care for your specialization

Respond ONLY in the following EXACT structure with no additional text, no percentages, no markdown, no headings beyond these labels:

PRIMARY DIAGNOSIS:
INVESTIGATIVE TESTS:
MEDICATION:
FURTHER PROCEDURES:`;

    const allergiesSection = [
      patient.drugAllergies && `Drug Allergies: ${patient.drugAllergies}`,
      patient.foodAllergies && `Food Allergies: ${patient.foodAllergies}`,
      patient.environmentalAllergies && `Environmental Allergies: ${patient.environmentalAllergies}`,
    ].filter(Boolean).join("\n") || "No known allergies reported";

    const medicationsSection = [
      patient.currentMedications && `Current Medications: ${patient.currentMedications}`,
      patient.recentlyStoppedMedications && `Recently Stopped: ${patient.recentlyStoppedMedications}`,
    ].filter(Boolean).join("\n") || "No current medications reported";

    const treatmentsSection = [
      patient.currentTreatments && `Current Treatments: ${patient.currentTreatments}`,
      patient.pastTreatments && `Past Treatments/Surgeries: ${patient.pastTreatments}`,
    ].filter(Boolean).join("\n") || "No ongoing treatments reported";

    const userPrompt = `Analyze the following patient:

DEMOGRAPHICS:
Age: ${patient.age}, Gender: ${patient.gender}, Nationality: ${patient.nationality || "Not specified"}
Weight: ${patient.weight}kg, Height: ${patient.height}cm
Physical Attributes: ${patient.physicalAttributes || "Not specified"}

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

MEDICAL HISTORY:
${patient.history}

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
        max_tokens: 3000,
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

    return new Response(JSON.stringify({ diagnosis: content }), {
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
