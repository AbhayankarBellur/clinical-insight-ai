import { DiagnosisResult, DoctorConfig, PatientData, DiagnosisState, SectionKey } from "@/types/medical";
import { ResultCard } from "./ResultCard";
import { SelectablePrintContent } from "./SelectablePrintContent";
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw, Settings, AlertCircle, Zap, FileText, Microscope, Save, CheckCircle, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DiagnosisResultsProps {
  result: DiagnosisResult;
  diagnosisState?: DiagnosisState | null;
  doctor?: DoctorConfig | null;
  patient?: PatientData | null;
  onNewPatient: () => void;
  onReconfigure: () => void;
  onSave?: (approvedItems?: Record<string, number[]>) => void;
  saving?: boolean;
  savedToken?: string | null;
}

const modeLabels = {
  pre: { label: "Pre-Diagnosis", icon: Zap, color: "bg-warning/10 text-warning" },
  detailed: { label: "Detailed Diagnosis", icon: FileText, color: "bg-primary/10 text-primary" },
  research: { label: "Diagnostic Research", icon: Microscope, color: "bg-accent text-accent-foreground" },
};

const baseSectionKeys: { key: SectionKey; title: string }[] = [
  { key: "primaryDiagnosis", title: "Primary Diagnosis" },
  { key: "investigativeTests", title: "Investigative Tests" },
  { key: "medication", title: "Medication" },
  { key: "furtherProcedures", title: "Further Procedures" },
];

export function DiagnosisResults({
  result,
  diagnosisState,
  doctor,
  patient,
  onNewPatient,
  onReconfigure,
  onSave,
  saving,
  savedToken,
}: DiagnosisResultsProps) {
  const [printMode, setPrintMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, Set<number>>>({});
  const [editedItems, setEditedItems] = useState<Record<string, Record<number, string>>>({});

  const handleEditItem = (sectionKey: string, index: number, value: string) => {
    setEditedItems((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] || {}), [index]: value },
    }));
  };

  const handleSelectionChange = (sectionKey: string, index: number, checked: boolean) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      const set = new Set(prev[sectionKey] || []);
      if (checked) set.add(index);
      else set.delete(index);
      next[sectionKey] = set;
      return next;
    });
  };

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 300);
  };

  const handleSave = () => {
    if (!onSave) return;
    // Convert Sets to arrays for JSON storage
    const approvedItems: Record<string, number[]> = {};
    for (const [key, set] of Object.entries(selectedItems)) {
      if (set.size > 0) approvedItems[key] = Array.from(set);
    }
    onSave(Object.keys(approvedItems).length > 0 ? approvedItems : undefined);
  };

  const hasParsingIssue =
    !result.primaryDiagnosis && !result.investigativeTests && !result.medication && !result.furtherProcedures;

  const mode = diagnosisState?.mode || "detailed";
  const ModeIcon = modeLabels[mode].icon;

  const hasSelections = Object.values(selectedItems).some((s) => s.size > 0);

  // Build section list — append imageAnalysis conditionally only when it has content
  const sectionKeys = [
    ...baseSectionKeys,
    ...(result.imageAnalysis ? [{ key: "imageAnalysis" as SectionKey, title: "Image Analysis" }] : []),
  ];

  return (
    <div className="space-y-4 sm:space-y-6 print-content">
      <div className="print-only mb-6">
        <h1 className="text-xl font-bold mb-2">Intuition — Clinical Decision Support Report</h1>
        <p className="text-sm text-muted-foreground">
          Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
      </div>

      <div className="no-print">
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", modeLabels[mode].color)}>
          <ModeIcon className="w-3.5 h-3.5" />
          {modeLabels[mode].label} Mode
        </span>
      </div>

      {(doctor || patient) && (
        <div className="print-only clinical-card p-4 mb-6">
          {doctor && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Physician Configuration</h3>
              <p className="text-sm">{doctor.designation} • {doctor.degree} • {doctor.specialization}</p>
            </div>
          )}
          {patient && (
            <div>
              <h3 className="font-semibold mb-2">Patient Summary</h3>
              <div className="text-sm grid grid-cols-2 gap-2">
                <p>Age: {patient.age} years</p>
                <p>Gender: {patient.gender}</p>
                <p>Weight: {patient.weight} kg</p>
                <p>Height: {patient.height} cm</p>
                <p>BP: {patient.bp}</p>
                <p>O2 Sat: {patient.o2}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {hasParsingIssue && (
        <div className="clinical-card p-4 border-l-4 border-l-warning no-print rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Parsing Warning</p>
              <p className="text-sm text-muted-foreground">Unable to parse structured response. Raw response displayed below.</p>
            </div>
          </div>
        </div>
      )}

      {/* Print selection hint */}
      {!printMode && (
        <div className="no-print clinical-card p-3 rounded-xl border-l-4 border-l-primary/40">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Print Selection:</strong> Use the checkboxes below each section to select items for the printed report. Only checked items will appear in the PDF.
          </p>
        </div>
      )}

      {sectionKeys.map(({ key, title }) => {
        const content = diagnosisState?.sections[key]?.output || (result as unknown as Record<string, string>)[key] || "";
        const variant = key === "primaryDiagnosis" ? "diagnosis" : key === "investigativeTests" ? "tests" : key === "medication" ? "medication" : key === "imageAnalysis" ? "imaging" : "procedures";
        return (
          <div key={key}>
            {printMode ? (
              // In print mode, show only selected items with clean formatting
              hasSelections && selectedItems[key]?.size > 0 ? (
                <div className={cn("result-card border-l-4", variant === "diagnosis" ? "border-l-primary" : variant === "tests" ? "border-l-warning" : variant === "medication" ? "border-l-success" : "border-l-primary")}>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
                  <SelectablePrintContent
                    content={content}
                    sectionKey={key}
                    selectedItems={selectedItems}
                    onSelectionChange={handleSelectionChange}
                    editedItems={editedItems}
                    printMode={true}
                  />
                </div>
              ) : !hasSelections ? (
                // If no selections at all, print everything (fallback)
                <ResultCard title={title} content={content} variant={variant} sectionState={diagnosisState?.sections[key]} />
              ) : null
            ) : (
              <>
                <ResultCard title={title} content={content} variant={variant} sectionState={diagnosisState?.sections[key]} />
                {/* Selectable items below each card */}
                <div className="mt-2 clinical-card p-3 rounded-xl no-print">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Select for Print</p>
                  <SelectablePrintContent
                    content={content}
                    sectionKey={key}
                    selectedItems={selectedItems}
                    onSelectionChange={handleSelectionChange}
                    editedItems={editedItems}
                    onEditItem={handleEditItem}
                    printMode={false}
                  />
                </div>
              </>
            )}
          </div>
        );
      })}

      {hasParsingIssue && <ResultCard title="Raw AI Response" content={result.rawResponse} variant="raw" />}

      <div className="clinical-card p-4 medical-disclaimer rounded-xl">
        <p className="text-xs text-muted-foreground">
          <strong>Medical Disclaimer:</strong> This clinical decision support tool is intended for use by licensed medical professionals only. All recommendations must be validated by a qualified practitioner before clinical application.
        </p>
      </div>

      {savedToken && (
        <div className="clinical-card p-4 border-l-4 border-l-primary rounded-xl no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Diagnosis Saved</p>
              <p className="text-sm text-muted-foreground">Token: <span className="font-mono font-semibold text-primary">{savedToken}</span></p>
              {hasSelections && (
                <p className="text-xs text-muted-foreground mt-1">Doctor-approved items have been tagged in the saved record.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center pt-4 no-print">
        {onSave && !savedToken && (
          <Button onClick={handleSave} disabled={saving} className="rounded-xl text-xs sm:text-sm">
            <Save className="w-4 h-4 mr-1 sm:mr-2" />
            {saving ? "Saving..." : "Save Diagnosis"}
          </Button>
        )}
        <Button onClick={handlePrint} variant="outline" className="rounded-xl text-xs sm:text-sm">
          <Printer className="w-4 h-4 mr-1 sm:mr-2" />
          {hasSelections ? `Print Selected` : "Print Report"}
        </Button>
        <Button onClick={onNewPatient} variant="outline" className="rounded-xl text-xs sm:text-sm">
          <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" /> New Patient
        </Button>
        <Button onClick={onReconfigure} variant="outline" className="rounded-xl text-xs sm:text-sm">
          <Settings className="w-4 h-4 mr-1 sm:mr-2" /> Reconfigure
        </Button>
      </div>
    </div>
  );
}
