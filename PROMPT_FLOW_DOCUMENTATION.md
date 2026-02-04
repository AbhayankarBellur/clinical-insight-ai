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
        │
        ▼
┌─────────────────┐     ┌──────────────────┐
│  /reasoning     │     │  /section-update │
│  (On-demand)    │     │  (Edit refinement)│
└─────────────────┘     └──────────────────┘
```

---

## 2. DIAGNOSIS MODES

Three mutually exclusive modes control form fields, validation, and prompt depth:

| Mode | Purpose | Visible Fields | Validation | Token Limit |
|------|---------|----------------|------------|-------------|
| `pre` | Quick triage | Minimal required | Loose | 1500 |
| `detailed` | Full clinical | All standard | Moderate | 3000 |
| `research` | Academic/complex | Standard + research | Contextual | 4000 |

### Mode-Specific Prompt Modifiers

**Pre-Diagnosis Mode:**
```
QUICK TRIAGE MODE:
- Provide concise differential diagnosis
- Limit to top 3 conditions with probability percentages
- Focus on immediate safety and direction
- Avoid verbose rationale
- Prioritize red flags and urgent conditions
```

**Detailed Mode:**
```
DETAILED DIAGNOSIS MODE:
- Provide comprehensive differential diagnosis with probability percentages
- Expand investigation rationale
- Consider contraindications and comorbidities
- Balance thoroughness with clinical practicality
```

**Research Mode:**
```
DIAGNOSTIC RESEARCH MODE:
- Provide extended differential diagnosis including rare conditions
- Correlate epidemiological and genetic factors
- Expand investigative and pathophysiological reasoning
- Include uncommon but plausible conditions
- Consider academic/specialist-level analysis
```

---

## 3. INPUT PAYLOAD STRUCTURE

### Sent from Frontend (`PatientSummary.tsx`):

```typescript
await supabase.functions.invoke("diagnose", {
  body: { doctor, patient: data, mode },
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
  
  // Safety Data
  drugAllergies: string;
  foodAllergies: string;
  environmentalAllergies: string;
  currentMedications: string;
  recentlyStoppedMedications: string;
  currentTreatments: string;
  pastTreatments: string;
  
  // Research Mode Fields (optional)
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
```

---

## 4. AI PROMPT CONSTRUCTION

### Location: `supabase/functions/diagnose/index.ts`

### System Prompt Structure:

```
You are a ${doctor.designation} with ${doctor.degree} specializing in ${doctor.specialization}. 

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

${MODE_MODIFIER}

Instructions:
- Analyze the patient data including examination findings provided by the examining physician
- Provide a structured diagnostic assessment following evidence-based clinical guidelines
- For PRIMARY DIAGNOSIS: Provide a ranked differential diagnosis with probability percentages

Respond ONLY in the following EXACT structure:

PRIMARY DIAGNOSIS:
INVESTIGATIVE TESTS:
MEDICATION:
FURTHER PROCEDURES:
```

### Context Pruning

Empty fields are automatically pruned before sending to reduce token usage:

```typescript
const pruneEmptyFields = (obj) => {
  const pruned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== "" && value !== 0) {
      pruned[key] = value;
    }
  }
  return pruned;
};
```

---

## 5. SECTION-LEVEL INTELLIGENCE

### 5.1 State Structure

```typescript
interface DiagnosisState {
  result: DiagnosisResult;
  mode: DiagnosisMode;
  sections: Record<SectionKey, SectionState>;
}

interface SectionState {
  output: string;              // Current section content
  reasoning: string | null;    // Cached reasoning explanation
  isLoadingReasoning: boolean;
  isLoadingEdit: boolean;
}
```

### 5.2 Reasoning Endpoint

`POST /reasoning`

**Purpose:** Generate clinical reasoning for a specific section.

**Payload:**
```typescript
{
  section: SectionKey;
  sectionOutput: string;
  doctorProfile: { designation, degree, specialization };
  patientSummary: { age, gender, symptoms, diagnosis };
}
```

**Response:** `{ reasoning: string }`

### 5.3 Section Update Endpoint

`POST /section-update`

**Purpose:** Regenerate only one section based on doctor instruction.

**Payload:**
```typescript
{
  section: SectionKey;
  editInstruction: string;
  fullDiagnosisText: string;
  doctorProfile: { designation, degree, specialization };
  patientSummaryCompressed: { age, gender, symptoms, allergies?, currentMedications? };
}
```

**Context Pruning by Section:**

| Section | Required Context |
|---------|-----------------|
| primaryDiagnosis | Full patient context |
| investigativeTests | Diagnosis + vitals |
| medication | Allergies + medications + diagnosis |
| furtherProcedures | Diagnosis + tests |

**Response:** `{ updatedContent: string }`

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
  // ... similar for other sections
  
  return result;
}
```

### Regex Patterns:

| Section | Pattern | Captures Until |
|---------|---------|----------------|
| PRIMARY DIAGNOSIS | `/PRIMARY DIAGNOSIS:\s*([\s\S]*?)(?=INVESTIGATIVE TESTS:\|$)/i` | Next section or end |
| INVESTIGATIVE TESTS | `/INVESTIGATIVE TESTS:\s*([\s\S]*?)(?=MEDICATION:\|$)/i` | Next section or end |
| MEDICATION | `/MEDICATION:\s*([\s\S]*?)(?=FURTHER PROCEDURES:\|$)/i` | Next section or end |
| FURTHER PROCEDURES | `/FURTHER PROCEDURES:\s*([\s\S]*?)$/i` | End of string |

---

## 7. UI OUTPUT MAPPING

### Location: `src/components/results/DiagnosisResults.tsx`

Each result section renders in `ResultCard` component with 3 tabs:

| Tab | Content | Behavior |
|-----|---------|----------|
| Output | Parsed section content | Default view |
| Reasoning | AI-generated explanation | Fetched on demand, cached |
| Edit | Instruction textarea | Triggers section regeneration |

### Parsing Failure Detection:
```typescript
const hasParsingIssue =
  !result.primaryDiagnosis &&
  !result.investigativeTests &&
  !result.medication &&
  !result.furtherProcedures;
```

---

## 8. ERROR HANDLING

### Edge Function Errors:
- 429: Rate limit exceeded
- 402: Payment required
- 401: Invalid API key
- 500: General server error

### Frontend Error Display:
Toast notification with error message via `useToast` hook.

---

## 9. TECHNICAL CONFIGURATION

- **Model:** `google/gemini-2.5-flash`
- **Temperature:** `0.3` (prioritizes consistency)
- **Max Tokens:** Variable by mode (1500/3000/4000)
- **Gateway:** `https://ai.gateway.lovable.dev/v1/chat/completions`

---

## 10. FLOW SUMMARY

```
1. User selects Diagnosis Mode (pre/detailed/research)
2. User fills PatientForm with mode-appropriate fields
3. Form submitted → PatientSummary.handleSubmit()
4. Data sent to edge function: { doctor, patient, mode }
5. Edge function builds systemPrompt + userPrompt with mode modifier
6. API call to Lovable AI Gateway (Gemini 2.5 Flash)
7. Raw response extracted from choices[0].message.content
8. Response returned as { diagnosis: content, mode }
9. Frontend calls parseDiagnosis(response.diagnosis)
10. Regex extracts 4 sections into DiagnosisResult object
11. DiagnosisResults component renders 4 ResultCards with tabs
12. User can request reasoning or edit any section independently
13. If parsing fails → rawResponse shown in expandable panel
```
