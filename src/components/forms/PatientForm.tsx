import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PatientData, DiagnosisMode } from "@/types/medical";
import { ArrowLeft, Stethoscope, AlertTriangle, Pill, Activity, ChevronDown, Microscope } from "lucide-react";
import { useState } from "react";

// Dynamic schema based on mode
const createSchema = (mode: DiagnosisMode) => {
  const baseSchema = {
    age: z.number().min(0).max(120),
    gender: z.string().min(1, "Gender is required"),
    weight: z.number().min(0).max(500),
    bp: z.string().regex(/^\d{2,3}\/\d{2,3}$/, "Format: systolic/diastolic (e.g., 120/80)"),
    o2: z.number().min(0).max(100),
    symptoms: mode === "pre" 
      ? z.string().min(10, "Minimum 10 characters").max(500)
      : z.string().min(20, "Minimum 20 characters").max(1000),
    examinationFindings: mode === "pre"
      ? z.string().min(20, "Minimum 20 characters").max(1000)
      : z.string().min(50, "Minimum 50 characters").max(2000),
  };

  const optionalFields = {
    nationality: z.string().max(100).optional(),
    height: z.number().min(0).max(300).optional(),
    physicalAttributes: z.string().max(500).optional(),
    history: z.string().max(1500).optional(),
    drugAllergies: z.string().max(800).optional(),
    foodAllergies: z.string().max(800).optional(),
    environmentalAllergies: z.string().max(500).optional(),
    currentMedications: z.string().max(800).optional(),
    recentlyStoppedMedications: z.string().max(800).optional(),
    currentTreatments: z.string().max(800).optional(),
    pastTreatments: z.string().max(800).optional(),
    familyMedicalHistory: z.string().max(2000).optional(),
    geneticConditions: z.string().max(1000).optional(),
    epidemiologicalExposure: z.string().max(1000).optional(),
    travelHistory: z.string().max(1000).optional(),
    occupationalExposure: z.string().max(1000).optional(),
    immunizationHistory: z.string().max(1000).optional(),
    previousLabResults: z.string().max(3000).optional(),
    imagingFindings: z.string().max(2000).optional(),
    specialistOpinions: z.string().max(2000).optional(),
    researchNotes: z.string().max(5000).optional(),
  };

  if (mode === "pre") {
    return z.object({ ...baseSchema, ...optionalFields });
  }

  // Detailed and Research modes require height and history
  return z.object({
    ...baseSchema,
    ...optionalFields,
    height: z.number().min(0).max(300),
    history: z.string().min(20, "Minimum 20 characters").max(1500),
  });
};

type FormData = z.infer<ReturnType<typeof createSchema>>;

interface PatientFormProps {
  onSubmit: (data: PatientData, mode: DiagnosisMode) => void;
  onBack: () => void;
  isLoading: boolean;
  initialMode?: DiagnosisMode;
}

export function PatientForm({ onSubmit, onBack, isLoading, initialMode = "detailed" }: PatientFormProps) {
  const mode = initialMode;
  const [researchOpen, setResearchOpen] = useState(false);
  
  const schema = createSchema(mode);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      age: undefined,
      gender: "",
      nationality: "",
      weight: undefined,
      height: undefined,
      physicalAttributes: "",
      bp: "",
      o2: undefined,
      symptoms: "",
      history: "",
      examinationFindings: "",
      drugAllergies: "",
      foodAllergies: "",
      environmentalAllergies: "",
      currentMedications: "",
      recentlyStoppedMedications: "",
      currentTreatments: "",
      pastTreatments: "",
      familyMedicalHistory: "",
      geneticConditions: "",
      epidemiologicalExposure: "",
      travelHistory: "",
      occupationalExposure: "",
      immunizationHistory: "",
      previousLabResults: "",
      imagingFindings: "",
      specialistOpinions: "",
      researchNotes: "",
    },
    mode: "onChange",
  });

  const weight = watch("weight");
  const height = watch("height");
  const bmi = weight && height ? (weight / Math.pow(height / 100, 2)).toFixed(1) : null;

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      age: data.age,
      gender: data.gender,
      nationality: data.nationality || "",
      weight: data.weight,
      height: data.height || 0,
      physicalAttributes: data.physicalAttributes || "",
      bp: data.bp,
      o2: data.o2,
      symptoms: data.symptoms,
      history: data.history || "",
      examinationFindings: data.examinationFindings,
      drugAllergies: data.drugAllergies || "",
      foodAllergies: data.foodAllergies || "",
      environmentalAllergies: data.environmentalAllergies || "",
      currentMedications: data.currentMedications || "",
      recentlyStoppedMedications: data.recentlyStoppedMedications || "",
      currentTreatments: data.currentTreatments || "",
      pastTreatments: data.pastTreatments || "",
      familyMedicalHistory: data.familyMedicalHistory || "",
      geneticConditions: data.geneticConditions || "",
      epidemiologicalExposure: data.epidemiologicalExposure || "",
      travelHistory: data.travelHistory || "",
      occupationalExposure: data.occupationalExposure || "",
      immunizationHistory: data.immunizationHistory || "",
      previousLabResults: data.previousLabResults || "",
      imagingFindings: data.imagingFindings || "",
      specialistOpinions: data.specialistOpinions || "",
      researchNotes: data.researchNotes || "",
    }, mode);
  };

  const showDetailedFields = mode !== "pre";
  const showResearchFields = mode === "research";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Demographics Card */}
      <div className="clinical-card p-6">
        <h3 className="section-header">Demographics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age">
              Age (years) <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("age", { valueAsNumber: true })}
              type="number"
              placeholder="0-120"
              className="clinical-input"
            />
            {errors.age && (
              <p className="text-sm text-destructive">{errors.age.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">
              Gender <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("gender")}
              onValueChange={(value) => setValue("gender", value, { shouldValidate: true })}
            >
              <SelectTrigger className="clinical-input">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-sm text-destructive">{errors.gender.message}</p>
            )}
          </div>

          {showDetailedFields && (
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                {...register("nationality")}
                placeholder="Optional"
                className="clinical-input"
              />
            </div>
          )}
        </div>
      </div>

      {/* Vitals & Measurements Card */}
      <div className="clinical-card p-6">
        <h3 className="section-header">Vitals & Measurements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">
              Weight (kg) <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("weight", { valueAsNumber: true })}
              type="number"
              step="0.1"
              placeholder="0-500"
              className="clinical-input"
            />
            {errors.weight && (
              <p className="text-sm text-destructive">{errors.weight.message}</p>
            )}
          </div>

          {showDetailedFields && (
            <>
              <div className="space-y-2">
                <Label htmlFor="height">
                  Height (cm) <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register("height", { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  placeholder="0-300"
                  className="clinical-input"
                />
                {errors.height && (
                  <p className="text-sm text-destructive">{errors.height.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>BMI (calculated)</Label>
                <Input
                  value={bmi ? `${bmi} kg/m²` : "—"}
                  readOnly
                  className="clinical-input bg-muted"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="bp">
              Blood Pressure <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("bp")}
              placeholder="120/80"
              className="clinical-input"
            />
            {errors.bp && (
              <p className="text-sm text-destructive">{errors.bp.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="o2">
              O2 Saturation (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("o2", { valueAsNumber: true })}
              type="number"
              step="0.1"
              placeholder="0-100"
              className="clinical-input"
            />
            {errors.o2 && (
              <p className="text-sm text-destructive">{errors.o2.message}</p>
            )}
          </div>

          {showDetailedFields && (
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="physicalAttributes">Physical Attributes</Label>
              <Textarea
                {...register("physicalAttributes")}
                placeholder="Notable physical characteristics, body type (optional)"
                className="clinical-input min-h-[80px]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Allergies & Medications */}
      <div className="clinical-card p-6 border-l-4 border-l-warning">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="section-header mb-0">
            {mode === "pre" ? "Safety Info (Optional)" : "Allergies, Medications & Treatments"}
          </h3>
        </div>
        {showDetailedFields && (
          <p className="text-sm text-muted-foreground mb-4">
            Critical safety information for contraindication checking
          </p>
        )}

        {/* Allergies Section */}
        <div className="space-y-4 mb-6">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Allergies & Sensitivities
          </h4>
          <div className={`grid grid-cols-1 ${showDetailedFields ? "md:grid-cols-3" : ""} gap-4`}>
            <div className="space-y-2">
              <Label htmlFor="drugAllergies">Drug Allergies</Label>
              <Textarea
                {...register("drugAllergies")}
                placeholder="List known drug allergies and reactions"
                className="clinical-input min-h-[80px]"
              />
            </div>
            {showDetailedFields && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="foodAllergies">Food Allergies</Label>
                  <Textarea
                    {...register("foodAllergies")}
                    placeholder="List known food allergies"
                    className="clinical-input min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="environmentalAllergies">Environmental Allergies</Label>
                  <Textarea
                    {...register("environmentalAllergies")}
                    placeholder="Pollen, dust, latex, etc."
                    className="clinical-input min-h-[80px]"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Medications Section */}
        <div className="space-y-4 mb-6">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Pill className="w-4 h-4" />
            Current & Recent Medications
          </h4>
          <div className={`grid grid-cols-1 ${showDetailedFields ? "md:grid-cols-2" : ""} gap-4`}>
            <div className="space-y-2">
              <Label htmlFor="currentMedications">Current Medications</Label>
              <Textarea
                {...register("currentMedications")}
                placeholder="List all current medications with dosages"
                className="clinical-input min-h-[100px]"
              />
            </div>
            {showDetailedFields && (
              <div className="space-y-2">
                <Label htmlFor="recentlyStoppedMedications">Recently Stopped Medications</Label>
                <Textarea
                  {...register("recentlyStoppedMedications")}
                  placeholder="Medications stopped within last 3 months"
                  className="clinical-input min-h-[100px]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Treatments Section */}
        {showDetailedFields && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Ongoing / Past Treatments
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentTreatments">Current Treatments</Label>
                <Textarea
                  {...register("currentTreatments")}
                  placeholder="Ongoing therapies, dialysis, chemotherapy, etc."
                  className="clinical-input min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pastTreatments">Past Treatments / Surgeries</Label>
                <Textarea
                  {...register("pastTreatments")}
                  placeholder="Previous surgeries, procedures, therapies"
                  className="clinical-input min-h-[100px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clinical Examination Card */}
      <div className="clinical-card p-6 border-l-4 border-l-primary">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope className="w-5 h-5 text-primary" />
          <h3 className="section-header mb-0">Primary Examination Findings</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Document your direct clinical observations during physical examination
        </p>
        <div className="space-y-2">
          <Label htmlFor="examinationFindings">
            Examination Findings <span className="text-destructive">*</span>
          </Label>
          <Textarea
            {...register("examinationFindings")}
            placeholder="General appearance, cardiovascular examination, respiratory examination, abdominal examination, neurological examination, musculoskeletal findings, skin examination..."
            className={`clinical-input ${mode === "pre" ? "min-h-[100px]" : "min-h-[150px]"}`}
          />
          {errors.examinationFindings && (
            <p className="text-sm text-destructive">{errors.examinationFindings.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Minimum {mode === "pre" ? "20" : "50"} characters
          </p>
        </div>
      </div>

      {/* Symptoms & History Card */}
      <div className="clinical-card p-6">
        <h3 className="section-header">Symptoms & History</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symptoms">
              Symptoms <span className="text-destructive">*</span>
            </Label>
            <Textarea
              {...register("symptoms")}
              placeholder="Patient's reported symptoms, onset, duration, severity, aggravating/relieving factors"
              className="clinical-input min-h-[100px]"
            />
            {errors.symptoms && (
              <p className="text-sm text-destructive">{errors.symptoms.message}</p>
            )}
          </div>

          {showDetailedFields && (
            <div className="space-y-2">
              <Label htmlFor="history">
                Medical History <span className="text-destructive">*</span>
              </Label>
              <Textarea
                {...register("history")}
                placeholder="Past medical history, surgical history, family history, social history"
                className="clinical-input min-h-[100px]"
              />
              {errors.history && (
                <p className="text-sm text-destructive">{errors.history.message}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Research Context Section */}
      {showResearchFields && (
        <Collapsible open={researchOpen} onOpenChange={setResearchOpen}>
          <div className="clinical-card p-6 border-l-4 border-l-accent-foreground">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Microscope className="w-5 h-5 text-accent-foreground" />
                <h3 className="section-header mb-0">Research Context</h3>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${researchOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Extended context for academic/complex case analysis
            </p>

            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="familyMedicalHistory">Family Medical History</Label>
                  <Textarea
                    {...register("familyMedicalHistory")}
                    placeholder="Hereditary conditions, family disease patterns..."
                    className="clinical-input min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geneticConditions">Genetic Conditions Known</Label>
                  <Textarea
                    {...register("geneticConditions")}
                    placeholder="Known genetic disorders, test results..."
                    className="clinical-input min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="epidemiologicalExposure">Epidemiological Exposure</Label>
                  <Textarea
                    {...register("epidemiologicalExposure")}
                    placeholder="Disease outbreaks, endemic areas, contacts..."
                    className="clinical-input min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travelHistory">Travel History</Label>
                  <Textarea
                    {...register("travelHistory")}
                    placeholder="Recent travel, endemic regions visited..."
                    className="clinical-input min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupationalExposure">Occupational / Environmental Exposure</Label>
                  <Textarea
                    {...register("occupationalExposure")}
                    placeholder="Work hazards, chemical exposure, pollution..."
                    className="clinical-input min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="immunizationHistory">Immunization History</Label>
                  <Textarea
                    {...register("immunizationHistory")}
                    placeholder="Vaccination records, recent immunizations..."
                    className="clinical-input min-h-[100px]"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="previousLabResults">Previous Lab Results</Label>
                  <Textarea
                    {...register("previousLabResults")}
                    placeholder="Recent laboratory findings, trends, abnormalities..."
                    className="clinical-input min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imagingFindings">Imaging Findings</Label>
                  <Textarea
                    {...register("imagingFindings")}
                    placeholder="X-ray, CT, MRI, ultrasound reports..."
                    className="clinical-input min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialistOpinions">Specialist Opinions</Label>
                  <Textarea
                    {...register("specialistOpinions")}
                    placeholder="Previous specialist consultations, opinions..."
                    className="clinical-input min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="researchNotes">Free Research Notes</Label>
                  <Textarea
                    {...register("researchNotes")}
                    placeholder="Additional observations, hypotheses, literature references..."
                    className="clinical-input min-h-[150px]"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button type="submit" disabled={!isValid || isLoading} size="lg">
          {isLoading ? (
            <span className="animate-pulse">Processing Clinical Data...</span>
          ) : (
            "Diagnose"
          )}
        </Button>
      </div>
    </form>
  );
}