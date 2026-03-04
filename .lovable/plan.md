
## Feature: Medical Image Upload & AI Analysis (Detailed + Research Modes Only)

### What's Being Added
A new collapsible section in the patient form — **"Diagnostic Imaging"** — visible only in `detailed` and `research` modes. It allows the doctor to:
1. Select the **imaging type** from a dropdown (ECG, Chest X-Ray, CT Scan, MRI, Echocardiogram, Fundoscopy, Spirometry, etc.)
2. Add a **region/descriptor** free-text field (e.g. "Bilateral basal lung fields", "12-lead resting ECG")
3. **Upload an image** from device or camera (JPEG/PNG, single image per submission)
4. On submit, the image is sent to the AI as a **base64 vision message** alongside the full patient data
5. The AI returns a **fifth output section: IMAGE ANALYSIS** — with its own Output + Reasoning

### What is NOT Changing (Full Guardrails)
- All existing 4 output sections: PRIMARY DIAGNOSIS, INVESTIGATIVE TESTS, MEDICATION, FURTHER PROCEDURES — unchanged
- Parse logic for existing sections — untouched
- Print flow (`window.print()`) — untouched
- Save/share/history — untouched
- Auth — untouched
- Pre-diagnosis mode — no image section appears
- UI of existing result cards — untouched
- Doctor form — untouched

---

### Files Changed

**1. `src/types/medical.ts`**
- Add optional fields to `PatientData`: `imagingType?: string`, `imagingDescriptor?: string`, `imagingImageBase64?: string`
- Add `"imageAnalysis"` to `SectionKey` union
- Add `imageAnalysis` + `imageAnalysisReasoning` fields to `DiagnosisResult`

**2. `src/components/forms/PatientForm.tsx`**
- Add a new collapsible card **"Diagnostic Imaging (Optional)"** shown only when `showDetailedFields` is true
- Inside: dropdown for imaging type → free text descriptor → `<input type="file" accept="image/*" capture="environment">` for device/camera
- State managed locally with `useState` (not react-hook-form, since file inputs can't be zod-validated meaningfully)
- On form submit, pass the base64 string + type + descriptor through to `onSubmit`

**3. `src/pages/PatientSummary.tsx`**
- When `imagingImageBase64` is present, include it in the `supabase.functions.invoke("diagnose")` body

**4. `supabase/functions/diagnose/index.ts`**
- Accept optional `imagingType`, `imagingDescriptor`, `imagingImageBase64` in request body
- If image is present: switch AI call to use `google/gemini-2.5-flash` with vision message format (messages array includes `image_url` content part)
- Append imaging context section to `userPrompt`
- Extend system prompt + response format to include a 5th section: `IMAGE ANALYSIS:`
- Max tokens bumped slightly for image-bearing requests

**5. `src/lib/parseDiagnosis.ts`**
- Add parsing logic for the optional `IMAGE ANALYSIS:` section (Output + Reasoning)
- If section absent (no image uploaded), fields remain empty strings — no regression

**6. `src/context/DiagnosisContext.tsx`**
- Update `setDiagnosisResult` to map `imageAnalysis` / `imageAnalysisReasoning` into sections

**7. `src/components/results/DiagnosisResults.tsx`**
- Add `imageAnalysis` to `sectionKeys` array **conditionally** — only rendered if `result.imageAnalysis` has content
- Uses existing `ResultCard` component — no new component needed

---

### Data Flow Diagram

```text
PatientForm (detailed/research)
  └── Imaging card: type dropdown + descriptor + file input
        └── FileReader → base64 string stored in local state
              └── Passed to onSubmit(patientData) with imaging fields

PatientSummary.tsx
  └── supabase.functions.invoke("diagnose", { body: { doctor, patient, mode } })
        └── patient now includes imagingType, imagingDescriptor, imagingImageBase64

diagnose/index.ts (edge function)
  └── If imagingImageBase64 present:
        - Build vision message: { role: "user", content: [ {type:"text"}, {type:"image_url"} ] }
        - Add IMAGE ANALYSIS section to system prompt format spec
        - gemini-2.5-flash handles vision natively
  └── Returns: diagnosis string with optional IMAGE ANALYSIS section

parseDiagnosis.ts
  └── Extracts IMAGE ANALYSIS Output + Reasoning (returns empty if absent)

DiagnosisResult type
  └── imageAnalysis + imageAnalysisReasoning populated

DiagnosisResults.tsx
  └── Renders ImageAnalysis ResultCard only when content exists
```

---

### Imaging Type Dropdown Options
ECG / 12-Lead ECG, Chest X-Ray, CT Scan, MRI, Echocardiogram, Ultrasound, Fundoscopy, PFT/Spirometry, Bone Density (DEXA), Mammogram, Endoscopy, Angiography, Nuclear Scan, Other

---

### Key Technical Constraints
- **Image size**: Client-side resize to max 800px before base64 encoding to keep payload manageable
- **Single image** per submission (simplest UX, no breaking complexity)
- **Gemini 2.5 Flash** already used and supports vision — no model change required
- No storage bucket needed — image is not persisted, only sent inline to the AI
- The `imagingImageBase64` field is NOT saved to `saved_diagnoses` table (excluded from `diagnosisStorage.ts` patientSummary snapshot — keeps DB clean)
