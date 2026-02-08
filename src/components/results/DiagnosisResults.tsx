import { DiagnosisResult, DoctorConfig, PatientData, DiagnosisState } from "@/types/medical";
import { ResultCard } from "./ResultCard";
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw, Settings, AlertCircle, Zap, FileText, Microscope, Save, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiagnosisResultsProps {
  result: DiagnosisResult;
  diagnosisState?: DiagnosisState | null;
  doctor?: DoctorConfig | null;
  patient?: PatientData | null;
  onNewPatient: () => void;
  onReconfigure: () => void;
  onSave?: () => void;
  saving?: boolean;
  savedToken?: string | null;
}

const modeLabels = {
  pre: { label: "Pre-Diagnosis", icon: Zap, color: "bg-warning/10 text-warning" },
  detailed: { label: "Detailed Diagnosis", icon: FileText, color: "bg-primary/10 text-primary" },
  research: { label: "Diagnostic Research", icon: Microscope, color: "bg-accent text-accent-foreground" },
};

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
  const handlePrint = () => window.print();

  const hasParsingIssue =
    !result.primaryDiagnosis && !result.investigativeTests && !result.medication && !result.furtherProcedures;

  const mode = diagnosisState?.mode || "detailed";
  const ModeIcon = modeLabels[mode].icon;

  return (
    <div className="space-y-6 print-content">
      <div className="print-only mb-6">
        <h1 className="text-xl font-bold mb-2">Clinical Decision Support Report</h1>
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

      <ResultCard title="Primary Diagnosis" content={diagnosisState?.sections.primaryDiagnosis.output || result.primaryDiagnosis} variant="diagnosis" sectionState={diagnosisState?.sections.primaryDiagnosis} />
      <ResultCard title="Investigative Tests" content={diagnosisState?.sections.investigativeTests.output || result.investigativeTests} variant="tests" sectionState={diagnosisState?.sections.investigativeTests} />
      <ResultCard title="Medication" content={diagnosisState?.sections.medication.output || result.medication} variant="medication" sectionState={diagnosisState?.sections.medication} />
      <ResultCard title="Further Procedures" content={diagnosisState?.sections.furtherProcedures.output || result.furtherProcedures} variant="procedures" sectionState={diagnosisState?.sections.furtherProcedures} />

      {hasParsingIssue && <ResultCard title="Raw AI Response" content={result.rawResponse} variant="raw" />}

      <div className="clinical-card p-4 medical-disclaimer rounded-xl">
        <p className="text-xs text-muted-foreground">
          <strong>Medical Disclaimer:</strong> This clinical decision support tool is intended for use by licensed medical professionals only. All recommendations must be validated by a qualified practitioner before clinical application.
        </p>
      </div>

      {/* Saved token display */}
      {savedToken && (
        <div className="clinical-card p-4 border-l-4 border-l-primary rounded-xl no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Diagnosis Saved</p>
              <p className="text-sm text-muted-foreground">Token: <span className="font-mono font-semibold text-primary">{savedToken}</span></p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center pt-4 no-print">
        {onSave && !savedToken && (
          <Button onClick={onSave} disabled={saving} className="rounded-xl">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Diagnosis"}
          </Button>
        )}
        <Button onClick={handlePrint} variant="outline" className="rounded-xl">
          <Printer className="w-4 h-4 mr-2" /> Print Report
        </Button>
        <Button onClick={onNewPatient} variant="outline" className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" /> New Patient
        </Button>
        <Button onClick={onReconfigure} variant="outline" className="rounded-xl">
          <Settings className="w-4 h-4 mr-2" /> Reconfigure Doctor
        </Button>
      </div>
    </div>
  );
}
