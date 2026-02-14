# Fix: Print-to-PDF for Capacitor APK  
GUARDRAILS:NO CHANGE IN UI FLOWS, DATABASE FUNCTIONALITY, REQUEST/ RESPONSE FORMATTING, OUTPUT + REASONING TAB CONTENT, SELECTION FEATURES, SHARING FEATURES AUTH, AI BEHAVIOUR, TYPES OF REASONING, PATIENT FORM INPUTS

## Problem

`window.print()` does not work inside Capacitor's Android WebView. The print button works in mobile browsers but fails silently in the APK.

## Solution

Replace `window.print()` with client-side PDF generation using `jspdf` + `html2canvas`. This captures the print content as an image, converts it to a PDF file, and triggers a download. Works identically in both browser and Capacitor WebView.

## What Changes

**Only one file is modified:** `src/components/results/DiagnosisResults.tsx`

- The `handlePrint` function (lines 59-65) will be updated
- Instead of calling `window.print()`, it will:
  1. Set `printMode = true` (same as now)
  2. Wait for React to render the selected items
  3. Use `html2canvas` to capture the `.print-content` div
  4. Use `jspdf` to create a PDF from the canvas
  5. Save/download the PDF file
  6. Set `printMode = false` (same as now)

**New dependencies added:**

- `jspdf` -- lightweight PDF generation
- `html2canvas` -- captures DOM elements as canvas images

## What Does NOT Change

- No UI changes -- same buttons, same layout, same checkboxes
- No changes to selection logic, save flow, auth, storage, sharing, edge functions, or any other component
- The print content rendering (SelectablePrintContent) stays identical
- All CSS classes (`print-only`, `no-print`, etc.) remain for browser print fallback compatibility

## Technical Details

```text
handlePrint flow:
  setPrintMode(true)
       |
  setTimeout (allow render)
       |
  html2canvas(.print-content)
       |
  jsPDF.addImage(canvas)
       |
  pdf.save("diagnosis-report.pdf")
       |
  setPrintMode(false)
```

The PDF will contain only doctor-approved/selected items (or full report if nothing selected), matching existing print behavior exactly.