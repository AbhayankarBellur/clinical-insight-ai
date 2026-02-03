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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { doctor, patient } = await req.json() as { doctor: DoctorConfig; patient: PatientData };
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
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

Instructions:
- Analyze the patient data including examination findings provided by the examining physician
- Provide a structured diagnostic assessment following evidence-based clinical guidelines
- Consider patient-specific factors (age, nationality, physical attributes, examination findings)
- Ensure all recommendations align with current standard of care for your specialization`;

    const userPrompt = `Analyze the following patient:
Age: ${patient.age}, Gender: ${patient.gender}, Nationality: ${patient.nationality || "Not specified"}
Weight: ${patient.weight}kg, Height: ${patient.height}cm
Physical Attributes: ${patient.physicalAttributes || "Not specified"}
Blood Pressure: ${patient.bp}, O2 Saturation: ${patient.o2}%

PRIMARY EXAMINATION FINDINGS (Performed by Physician):
${patient.examinationFindings}

Symptoms: ${patient.symptoms}
Medical History: ${patient.history}

Provide your response in EXACTLY this format:

PRIMARY DIAGNOSIS:
[Your primary diagnosis with confidence level and differential diagnoses]

INVESTIGATIVE TESTS:
[List of recommended tests with rationale for each]

MEDICATION:
[Detailed medication plan including drug names, dosages, frequency, and duration]

FURTHER PROCEDURES:
[Follow-up procedures, specialist referrals, lifestyle recommendations]`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
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
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid API key. Please check your configuration." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
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
