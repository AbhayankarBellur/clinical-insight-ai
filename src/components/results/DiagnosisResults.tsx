import { DiagnosisResult, DoctorConfig, PatientData } from "@/types/medical";
import { ResultCard } from "./ResultCard";
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw, Settings, AlertCircle } from "lucide-react";

interface DiagnosisResultsProps {
  result: DiagnosisResult;
  doctor?: DoctorConfig | null;
  patient?: PatientData | null;
  onNewPatient: () => void;
  onReconfigure: () => void;
}

export function DiagnosisResults({
  result,
  doctor,
  patient,
  onNewPatient,
  onReconfigure,
}: DiagnosisResultsProps) {
  const handlePrint = () => {
    window.print();
  };

  const hasParsingIssue =
    !result.primaryDiagnosis &&
    !result.investigativeTests &&
    !result.medication &&
    !result.furtherProcedures;

  return (
    <div className="space-y-6 print-content">
      {/* Print Header - Only visible when printing */}
      <div className="print-only mb-6">
        <h1 className="text-xl font-bold mb-2">Clinical Decision Support Report</h1>
        <p className="text-sm text-muted-foreground">
          Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Doctor & Patient Summary - Print only */}
      {(doctor || patient) && (
        <div className="print-only clinical-card p-4 mb-6">
          {doctor && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Physician Configuration</h3>
              <p className="text-sm">
                {doctor.designation} • {doctor.degree} • {doctor.specialization}
              </p>
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
        <div className="clinical-card p-4 border-l-4 border-l-warning no-print">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Parsing Warning</p>
              <p className="text-sm text-muted-foreground">
                Unable to parse structured response. Raw response displayed below.
              </p>
            </div>
          </div>
        </div>
      )}

      <ResultCard
        title="Primary Diagnosis"
        content={result.primaryDiagnosis}
        variant="diagnosis"
      />

      <ResultCard
        title="Investigative Tests"
        content={result.investigativeTests}
        variant="tests"
      />

      <ResultCard
        title="Medication"
        content={result.medication}
        variant="medication"
      />

      <ResultCard
        title="Further Procedures"
        content={result.furtherProcedures}
        variant="procedures"
      />

      {hasParsingIssue && (
        <ResultCard
          title="Raw AI Response"
          content={result.rawResponse}
          variant="raw"
        />
      )}

      {/* Medical Disclaimer - Always visible, styled for print */}
      <div className="clinical-card p-4 medical-disclaimer">
        <p className="text-xs text-muted-foreground">
          <strong>Medical Disclaimer:</strong> This clinical decision support tool is intended 
          for use by licensed medical professionals only. All recommendations must be validated 
          by a qualified practitioner before clinical application. This system does not replace 
          clinical judgment and should be used as a decision support aid only.
        </p>
      </div>

      {/* Action buttons - Hidden during print */}
      <div className="flex flex-wrap gap-3 justify-center pt-4 no-print">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </Button>
        <Button onClick={onNewPatient} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          New Patient
        </Button>
        <Button onClick={onReconfigure} variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Reconfigure Doctor
        </Button>
      </div>
    </div>
  );
}
