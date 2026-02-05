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
  ┌─────────────┐
  │ Cached      │ ← Reasoning pre-loaded from initial response
  │ Reasoning   │ ← NO additional API calls
  └─────────────┘
```

**Key Design:** One LLM call per diagnosis. Reasoning is embedded in initial response, not fetched on-demand.

---

## 2. DIAGNOSIS MODES

Three mutually exclusive modes control form fields, validation, and prompt depth:

| Mode | Purpose | Visible Fields | Validation | Token Limit |
|------|---------|----------------|------------|-------------|
| `pre` | Quick triage | Minimal required | Loose | 2000 |
| `detailed` | Full clinical | All standard | Moderate | 4000 |
| `research` | Academic/complex | Standard + research | Contextual | 5000 |

**All modes allow submission.** Difference is prompt depth, not permission.

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

## 4. AI RESPONSE CONTRACT (MANDATORY FORMAT)

The AI **MUST** respond with Output and Reasoning for each section:

```
PRIMARY DIAGNOSIS:
Output: [Ranked differential diagnosis with probability percentages]
Reasoning: [Clinical reasoning explaining why these diagnoses are considered]

INVESTIGATIVE TESTS:
Output: [Recommended tests in order of priority]
Reasoning: [Why each test is needed and what it will confirm/rule out]

MEDICATION:
Output: [Generic name (dosage) - Indian brand names, with frequency and duration]
Reasoning: [Why these medications are chosen, mechanism of action, contraindication checks]

FURTHER PROCEDURES:
Output: [Next steps, referrals, follow-up schedule]
Reasoning: [Why these procedures are recommended based on differential diagnosis]
```

### Medication Output Requirements (India Market)
- Always specify **generic drug composition** and dosage
- Provide **commonly available Indian market brand names**
- No vague terms like "antibiotic" or "painkiller"
- Format: `Generic Name (Dosage) - Indian Brand Names`

---

## 5. AI PROMPT CONSTRUCTION

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

MEDICATION INSTRUCTIONS (CRITICAL):
- Always specify generic drug composition and dosage
- Provide commonly available Indian market brand names where applicable
- Do not output vague terms like "antibiotic" or "painkiller"
- Avoid unavailable or region-specific brands outside India

Instructions:
- For each section, provide both the clinical Output AND the Reasoning behind it
- For PRIMARY DIAGNOSIS: Provide a ranked differential diagnosis with probability percentages

RESPONSE FORMAT (STRICTLY FOLLOW):
Each section MUST have Output: and Reasoning: subfields.

PRIMARY DIAGNOSIS:
Output: [ranked differential with probabilities]
Reasoning: [clinical reasoning]

INVESTIGATIVE TESTS:
Output: [tests]
Reasoning: [rationale]

MEDICATION:
Output: [generic (dose) - Indian brands]
Reasoning: [drug selection rationale]

FURTHER PROCEDURES:
Output: [procedures and follow-up]
Reasoning: [procedure rationale]
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

## 6. RESPONSE PARSING

### Location: `src/lib/parseDiagnosis.ts`

### Parser Function:

```typescript
export function parseDiagnosis(response: string): DiagnosisResult {
  // 1. Extract each main section (PRIMARY DIAGNOSIS, INVESTIGATIVE TESTS, etc.)
  // 2. For each section, parse Output: and Reasoning: subfields
  // 3. Return structured result with all outputs and reasonings
}
```

### Result Structure:

```typescript
interface DiagnosisResult {
  primaryDiagnosis: string;
  primaryDiagnosisReasoning: string;
  investigativeTests: string;
  investigativeTestsReasoning: string;
  medication: string;
  medicationReasoning: string;
  furtherProcedures: string;
  furtherProceduresReasoning: string;
  rawResponse: string;  // Fallback for parsing failures
}
```

### Section Extraction Logic:

1. Find section marker (e.g., `PRIMARY DIAGNOSIS:`)
2. Extract content until next section marker
3. Within content, find `Output:` and `Reasoning:` subfields
4. Fallback: If no subfields found, entire content becomes output

---

## 7. UI STATE STRUCTURE

### DiagnosisState
```typescript
interface DiagnosisState {
  result: DiagnosisResult;
  mode: DiagnosisMode;
  sections: Record<SectionKey, SectionState>;
}

interface SectionState {
  output: string;     // Clinical recommendation
  reasoning: string;  // Clinical rationale (pre-loaded)
}
```

### UI Tabs (2 tabs per section)

| Tab | Content | Source | API Call |
|-----|---------|--------|----------|
| **Output** | Clinical recommendation | `sectionState.output` | None |
| **Reasoning** | Clinical rationale | `sectionState.reasoning` | **None** (pre-loaded) |

**Key Behavior:**
- Reasoning tab does NOT trigger API calls
- All data comes from initial diagnosis response
- Zero latency on tab toggle

---

## 8. REMOVED FEATURES

The following features were **intentionally removed** for token efficiency:

| Feature | Status | Reason |
|---------|--------|--------|
| Edit Tab | Removed | Token savings, complexity reduction |
| `/section-update` endpoint | Deleted | No longer needed |
| `/reasoning` endpoint | Deleted | Reasoning now in initial response |
| Dynamic reasoning fetch | Removed | Pre-cached from initial call |

---

## 9. ERROR HANDLING

### Edge Function Errors:
- 429: Rate limit exceeded
- 402: Payment required
- 401: Invalid API key
- 500: General server error

### Frontend Error Display:
Toast notification with error message via `useToast` hook.

### Parsing Failure Detection:
```typescript
const hasParsingIssue =
  !result.primaryDiagnosis &&
  !result.investigativeTests &&
  !result.medication &&
  !result.furtherProcedures;
```

If parsing fails → rawResponse shown in expandable panel.

---

## 10. TECHNICAL CONFIGURATION

- **Model:** `google/gemini-2.5-flash`
- **Temperature:** `0.3` (prioritizes consistency)
- **Max Tokens:** Variable by mode (2000/4000/5000)
- **Gateway:** `https://ai.gateway.lovable.dev/v1/chat/completions`

---

## 11. PERFORMANCE GUARANTEES

| Constraint | Value |
|------------|-------|
| LLM calls per diagnosis | **1** |
| Reasoning tab API calls | **0** |
| Edit regeneration loops | **Removed** |
| Tab toggle latency | **0ms** |

---

## 12. FLOW SUMMARY

```
1. User selects Diagnosis Mode (pre/detailed/research)
2. User fills PatientForm with mode-appropriate fields
3. Form submitted → PatientSummary.handleSubmit()
4. Data sent to edge function: { doctor, patient, mode }
5. Edge function builds systemPrompt + userPrompt with mode modifier
6. API call to Lovable AI Gateway (Gemini 2.5 Flash)
7. Response includes Output + Reasoning for each section
8. Response returned as { diagnosis: content, mode }
9. Frontend calls parseDiagnosis(response.diagnosis)
10. Parser extracts 4 sections with their outputs and reasonings
11. DiagnosisResults component renders 4 ResultCards
12. Each card has 2 tabs: Output and Reasoning (pre-loaded)
13. If parsing fails → rawResponse shown in expandable panel
```
