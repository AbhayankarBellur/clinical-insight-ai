# Intuition - Prompt Flow & Response Parsing Documentation

## Overview

This document details the complete data flow from patient input → AI prompt → response → parsed output fields.

---

## 1. DATA FLOW ARCHITECTURE

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  PatientForm    │ ──► │  PatientSummary  │ ──► │  Edge Function  │
│  (UI Input)     │     │  (Submit Handler)│     │  /diagnose      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  DiagnosisResults│ ◄── │  parseDiagnosis  │ ◄── │  AI Gateway     │
│  (UI Output)    │     │  (Parser)        │     │  Response       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## 2. INPUT PAYLOAD STRUCTURE

### Sent from Frontend (`PatientSummary.tsx` line 28-30):

```typescript
await supabase.functions.invoke("diagnose", {
  body: { doctor, patient: data },
});
```

### Doctor Object (DoctorConfig):
```typescript
{
  designation: string;      // e.g., "Consultant", "Senior Resident"
  degree: string;          // e.g., "MD", "MBBS"
  specialization: string;  // e.g., "Internal Medicine", "Cardiology"
}
```

### Patient Object (PatientData):
```typescript
{
  // Demographics
  age: number;
  gender: string;
  nationality: string;
  weight: number;           // kg
  height: number;           // cm
  physicalAttributes: string;
  
  // Vitals
  bp: string;               // e.g., "120/80"
  o2: number;               // percentage
  
  // Clinical Findings
  symptoms: string;
  history: string;
  examinationFindings: string;
  
  // Safety Data (NEW FIELDS)
  drugAllergies: string;
  foodAllergies: string;
  environmentalAllergies: string;
  currentMedications: string;
  recentlyStoppedMedications: string;
  currentTreatments: string;
  pastTreatments: string;
}
```

---

## 3. AI PROMPT CONSTRUCTION

### Location: `supabase/functions/diagnose/index.ts`

### System Prompt (lines 48-78):

```
You are a ${doctor.designation} with ${doctor.degree} specializing in ${doctor.specialization}. 

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
FURTHER PROCEDURES:
```

### User Prompt (lines 96-132):

```
Analyze the following patient:

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

FURTHER PROCEDURES:
```

### Section Builders (lines 80-94):

```typescript
// Allergies Section
const allergiesSection = [
  patient.drugAllergies && `Drug Allergies: ${patient.drugAllergies}`,
  patient.foodAllergies && `Food Allergies: ${patient.foodAllergies}`,
  patient.environmentalAllergies && `Environmental Allergies: ${patient.environmentalAllergies}`,
].filter(Boolean).join("\n") || "No known allergies reported";

// Medications Section
const medicationsSection = [
  patient.currentMedications && `Current Medications: ${patient.currentMedications}`,
  patient.recentlyStoppedMedications && `Recently Stopped: ${patient.recentlyStoppedMedications}`,
].filter(Boolean).join("\n") || "No current medications reported";

// Treatments Section
const treatmentsSection = [
  patient.currentTreatments && `Current Treatments: ${patient.currentTreatments}`,
  patient.pastTreatments && `Past Treatments/Surgeries: ${patient.pastTreatments}`,
].filter(Boolean).join("\n") || "No ongoing treatments reported";
```

---

## 4. AI API CALL

### Location: `supabase/functions/diagnose/index.ts` (lines 134-149)

```typescript
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
```

### Response Extraction (lines 179-182):
```typescript
const data = await response.json();
const content = data.choices?.[0]?.message?.content || "";

return new Response(JSON.stringify({ diagnosis: content }), {...});
```

---

## 5. EXPECTED AI RESPONSE FORMAT

The AI is instructed to return EXACTLY this structure:

```
PRIMARY DIAGNOSIS:
[AI provides diagnosis text here]

INVESTIGATIVE TESTS:
[AI provides recommended tests here]

MEDICATION:
[AI provides medication recommendations here]

FURTHER PROCEDURES:
[AI provides follow-up procedures here]
```

**NO** markdown headers (##, ###)
**NO** confidence percentages
**NO** additional commentary outside sections
**NO** bullet point styling variations

---

## 6. RESPONSE PARSING

### Location: `src/lib/parseDiagnosis.ts`

### Parser Function:

```typescript
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
```

### Regex Patterns Explained:

| Section | Pattern | Captures Until |
|---------|---------|----------------|
| PRIMARY DIAGNOSIS | `/PRIMARY DIAGNOSIS:\s*([\s\S]*?)(?=INVESTIGATIVE TESTS:\|$)/i` | Next section or end |
| INVESTIGATIVE TESTS | `/INVESTIGATIVE TESTS:\s*([\s\S]*?)(?=MEDICATION:\|$)/i` | Next section or end |
| MEDICATION | `/MEDICATION:\s*([\s\S]*?)(?=FURTHER PROCEDURES:\|$)/i` | Next section or end |
| FURTHER PROCEDURES | `/FURTHER PROCEDURES:\s*([\s\S]*?)$/i` | End of string |

---

## 7. OUTPUT DATA STRUCTURE

### DiagnosisResult Type (`src/types/medical.ts`):

```typescript
export interface DiagnosisResult {
  primaryDiagnosis: string;
  investigativeTests: string;
  medication: string;
  furtherProcedures: string;
  rawResponse: string;  // Original AI output for fallback
}
```

---

## 8. UI OUTPUT MAPPING

### Location: `src/components/results/DiagnosisResults.tsx`

| Result Field | UI Card Title | Variant |
|--------------|---------------|---------|
| `result.primaryDiagnosis` | "Primary Diagnosis" | `diagnosis` |
| `result.investigativeTests` | "Investigative Tests" | `tests` |
| `result.medication` | "Medication" | `medication` |
| `result.furtherProcedures` | "Further Procedures" | `procedures` |
| `result.rawResponse` | "Raw AI Response" | `raw` (shown only on parse failure) |

### Parsing Failure Detection (lines 25-29):
```typescript
const hasParsingIssue =
  !result.primaryDiagnosis &&
  !result.investigativeTests &&
  !result.medication &&
  !result.furtherProcedures;
```

---

## 9. ERROR HANDLING

### Edge Function Errors:
- 429: Rate limit exceeded
- 402: Payment required
- 401: Invalid API key
- 500: General server error

### Frontend Error Display:
Toast notification with error message via `useToast` hook.

---

## 10. KNOWN PARSING ISSUES & SOLUTIONS

### Issue 1: AI adds markdown headers
**Problem:** AI returns `## PRIMARY DIAGNOSIS:` instead of `PRIMARY DIAGNOSIS:`
**Solution:** Parser uses case-insensitive matching, but markdown `##` prefix breaks pattern

**Fix needed:** Update regex to handle optional markdown:
```typescript
/(?:##\s*)?PRIMARY DIAGNOSIS:\s*([\s\S]*?)(?=(?:##\s*)?INVESTIGATIVE TESTS:|$)/i
```

### Issue 2: AI adds extra text before sections
**Problem:** AI adds preamble like "Based on the findings..."
**Solution:** Current regex handles this by matching from section label

### Issue 3: Inconsistent section labels
**Problem:** AI uses "DIAGNOSIS:" instead of "PRIMARY DIAGNOSIS:"
**Solution:** Add fallback patterns:
```typescript
/(?:PRIMARY\s+)?DIAGNOSIS:\s*([\s\S]*?)(?=INVESTIGATIVE|TESTS:|$)/i
```

### Issue 4: Truncated responses
**Problem:** AI response cuts off mid-section
**Solution:** `rawResponse` preserved for manual review

---

## 11. FLOW SUMMARY

```
1. User fills PatientForm with all fields
2. Form submitted → PatientSummary.handleSubmit()
3. Data sent to edge function: { doctor, patient }
4. Edge function builds systemPrompt + userPrompt
5. API call to Lovable AI Gateway (Gemini 2.5 Flash)
6. Raw response extracted from choices[0].message.content
7. Response returned as { diagnosis: content }
8. Frontend calls parseDiagnosis(response.diagnosis)
9. Regex extracts 4 sections into DiagnosisResult object
10. DiagnosisResults component renders 4 ResultCards
11. If parsing fails → rawResponse shown in expandable panel
```
