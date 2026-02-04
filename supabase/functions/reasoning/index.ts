import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReasoningRequest {
  section: "primaryDiagnosis" | "investigativeTests" | "medication" | "furtherProcedures";
  sectionOutput: string;
  doctorProfile: {
    designation: string;
    degree: string;
    specialization: string;
  };
  patientSummary: {
    age: number;
    gender: string;
    symptoms: string;
    diagnosis: string;
  };
}

const sectionLabels: Record<string, string> = {
  primaryDiagnosis: "PRIMARY DIAGNOSIS",
  investigativeTests: "INVESTIGATIVE TESTS",
  medication: "MEDICATION",
  furtherProcedures: "FURTHER PROCEDURES",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { section, sectionOutput, doctorProfile, patientSummary } = await req.json() as ReasoningRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Lovable API key not configured");
    }

    const sectionLabel = sectionLabels[section] || section;

    const systemPrompt = `You are a ${doctorProfile.designation} with ${doctorProfile.degree} specializing in ${doctorProfile.specialization}.

Your task is to explain the clinical reasoning behind a specific section of a diagnostic report.

Rules:
- Explain ONLY the reasoning for the ${sectionLabel} section
- Do NOT provide new recommendations
- Use bullet point format only
- Do NOT include probability percentages
- Do NOT use markdown headers
- Be concise but thorough
- Focus on evidence-based clinical reasoning`;

    const userPrompt = `Patient Context:
- Age: ${patientSummary.age}, Gender: ${patientSummary.gender}
- Presenting symptoms: ${patientSummary.symptoms}
- Primary diagnosis: ${patientSummary.diagnosis}

${sectionLabel} Output:
${sectionOutput}

Explain the clinical reasoning behind this ${sectionLabel} recommendation. Why were these specific items chosen? What clinical factors support this recommendation?`;

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Reasoning API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const reasoning = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ reasoning, section }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Reasoning error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
