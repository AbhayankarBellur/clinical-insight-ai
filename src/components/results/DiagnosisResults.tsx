import { DiagnosisResult, DoctorConfig, PatientData, DiagnosisState, SectionKey } from "@/types/medical";
import { ResultCard } from "./ResultCard";
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw, Settings, AlertCircle, Zap, FileText, Microscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiagnosisResultsProps {
  result: DiagnosisResult;
  diagnosisState?: DiagnosisState | null;
  doctor?: DoctorConfig | null;
  patient?: PatientData | null;
  onNewPatient: () => void;
  onReconfigure: () => void;
  onUpdateSection?: (section: SectionKey, output: string) => void;
  onUpdateReasoning?: (section: SectionKey, reasoning: string | null) => void;
  onSetLoading?: (section: SectionKey, type: "reasoning" | "edit", loading: boolean) => void;
}

const modeLabels = {
  pre: { label: "Pre-Diagnosis", icon: Zap },
  detailed: { label: "Detailed Diagnosis", icon: FileText },
  research: { label: "Diagnostic Research", icon: Microscope },
};

export function DiagnosisResults({
  result,
  diagnosisState,
  doctor,
  patient,
  onNewPatient,
  onReconfigure,
  onUpdateSection,
  onUpdateReasoning,
  onSetLoading,
}: DiagnosisResultsProps) {
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  const hasParsingIssue =
    !result.primaryDiagnosis &&
    !result.investigativeTests &&
    !result.medication &&
    !result.furtherProcedures;

  const mode = diagnosisState?.mode || "detailed";
  const ModeIcon = modeLabels[mode].icon;

  const handleRequestReasoning = async (section: SectionKey) => {
    if (!doctor || !patient || !onSetLoading || !onUpdateReasoning) return;
    
    const sectionOutput = diagnosisState?.sections[section]?.output || result[section];
    if (!sectionOutput) {
      toast({
        title: "No content",
        description: "This section has no content to explain.",
        variant: "destructive",
      });
      return;
    }

    onSetLoading(section, "reasoning", true);

    try {
      const { data, error } = await supabase.functions.invoke("reasoning", {
        body: {
          section,
          sectionOutput,
          doctorProfile: {
            designation: doctor.designation,
            degree: doctor.degree,
            specialization: doctor.specialization,
          },
          patientSummary: {
            age: patient.age,
            gender: patient.gender,
            symptoms: patient.symptoms,
            diagnosis: result.primaryDiagnosis,
          },
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      onUpdateReasoning(section, data.reasoning);
    } catch (error) {
      console.error("Reasoning error:", error);
      toast({
        title: "Reasoning Failed",
        description: error instanceof Error ? error.message : "Unable to generate reasoning.",
        variant: "destructive",
      });
    } finally {
      onSetLoading(section, "reasoning", false);
    }
  };

  const handleSubmitEdit = async (section: SectionKey, instruction: string) => {
    if (!doctor || !patient || !onSetLoading || !onUpdateSection || !onUpdateReasoning) return;

    onSetLoading(section, "edit", true);

    try {
      const { data, error } = await supabase.functions.invoke("section-update", {
        body: {
          section,
          editInstruction: instruction,
          fullDiagnosisText: result.rawResponse,
          doctorProfile: {
            designation: doctor.designation,
            degree: doctor.degree,
            specialization: doctor.specialization,
          },
          patientSummaryCompressed: {
            age: patient.age,
            gender: patient.gender,
            symptoms: patient.symptoms,
            allergies: patient.drugAllergies,
            currentMedications: patient.currentMedications,
          },
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      onUpdateSection(section, data.updatedContent);
      // Clear reasoning since content changed
      onUpdateReasoning(section, null);

      toast({
        title: "Section Updated",
        description: "The section has been regenerated based on your instruction.",
      });
    } catch (error) {
      console.error("Section update error:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Unable to update section.",
        variant: "destructive",
      });
    } finally {
      onSetLoading(section, "edit", false);
    }
  };

  const getSectionContent = (section: SectionKey): string => {
    return diagnosisState?.sections[section]?.output || result[section];
  };

  return (
    <div className="space-y-6 print-content">
      {/* Print Header - Only visible when printing */}
      <div className="print-only mb-6">
        <h1 className="text-xl font-bold mb-2">Clinical Decision Support Report</h1>
        <p className="text-sm text-muted-foreground">
          Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Mode indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground no-print">
        <ModeIcon className="w-4 h-4" />
        <span>{modeLabels[mode].label} Mode</span>
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
        content={getSectionContent("primaryDiagnosis")}
        variant="diagnosis"
        sectionKey="primaryDiagnosis"
        sectionState={diagnosisState?.sections.primaryDiagnosis}
        onRequestReasoning={() => handleRequestReasoning("primaryDiagnosis")}
        onSubmitEdit={(instruction) => handleSubmitEdit("primaryDiagnosis", instruction)}
      />

      <ResultCard
        title="Investigative Tests"
        content={getSectionContent("investigativeTests")}
        variant="tests"
        sectionKey="investigativeTests"
        sectionState={diagnosisState?.sections.investigativeTests}
        onRequestReasoning={() => handleRequestReasoning("investigativeTests")}
        onSubmitEdit={(instruction) => handleSubmitEdit("investigativeTests", instruction)}
      />

      <ResultCard
        title="Medication"
        content={getSectionContent("medication")}
        variant="medication"
        sectionKey="medication"
        sectionState={diagnosisState?.sections.medication}
        onRequestReasoning={() => handleRequestReasoning("medication")}
        onSubmitEdit={(instruction) => handleSubmitEdit("medication", instruction)}
      />

      <ResultCard
        title="Further Procedures"
        content={getSectionContent("furtherProcedures")}
        variant="procedures"
        sectionKey="furtherProcedures"
        sectionState={diagnosisState?.sections.furtherProcedures}
        onRequestReasoning={() => handleRequestReasoning("furtherProcedures")}
        onSubmitEdit={(instruction) => handleSubmitEdit("furtherProcedures", instruction)}
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
