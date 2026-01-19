import { DiagnosisResult } from "@/types/medical";
import { ResultCard } from "./ResultCard";
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw, Settings, AlertCircle } from "lucide-react";

interface DiagnosisResultsProps {
  result: DiagnosisResult;
  onNewPatient: () => void;
  onReconfigure: () => void;
}

export function DiagnosisResults({
  result,
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
    <div className="space-y-6">
      {hasParsingIssue && (
        <div className="clinical-card p-4 border-l-4 border-l-warning">
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

      <div className="flex flex-wrap gap-3 justify-center pt-4">
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
