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
import { PatientData } from "@/types/medical";
import { ArrowLeft, Stethoscope } from "lucide-react";

const schema = z.object({
  age: z.number().min(0).max(120),
  gender: z.string().min(1, "Gender is required"),
  nationality: z.string().max(100).optional(),
  weight: z.number().min(0).max(500),
  height: z.number().min(0).max(300),
  physicalAttributes: z.string().max(500).optional(),
  bp: z.string().regex(/^\d{2,3}\/\d{2,3}$/, "Format: systolic/diastolic (e.g., 120/80)"),
  o2: z.number().min(0).max(100),
  symptoms: z.string().min(20, "Minimum 20 characters").max(1000),
  history: z.string().min(20, "Minimum 20 characters").max(1500),
  examinationFindings: z.string().min(50, "Minimum 50 characters").max(2000),
});

type FormData = z.infer<typeof schema>;

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function PatientForm({ onSubmit, onBack, isLoading }: PatientFormProps) {
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
      height: data.height,
      physicalAttributes: data.physicalAttributes || "",
      bp: data.bp,
      o2: data.o2,
      symptoms: data.symptoms,
      history: data.history,
      examinationFindings: data.examinationFindings,
    });
  };

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

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              {...register("nationality")}
              placeholder="Optional"
              className="clinical-input"
            />
          </div>
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

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="physicalAttributes">Physical Attributes</Label>
            <Textarea
              {...register("physicalAttributes")}
              placeholder="Notable physical characteristics, body type (optional)"
              className="clinical-input min-h-[80px]"
            />
          </div>
        </div>
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
            className="clinical-input min-h-[150px]"
          />
          {errors.examinationFindings && (
            <p className="text-sm text-destructive">{errors.examinationFindings.message}</p>
          )}
          <p className="text-xs text-muted-foreground">Minimum 50 characters</p>
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

          <div className="space-y-2">
            <Label htmlFor="history">
              Medical History <span className="text-destructive">*</span>
            </Label>
            <Textarea
              {...register("history")}
              placeholder="Past medical history, surgical history, current medications, allergies, family history"
              className="clinical-input min-h-[100px]"
            />
            {errors.history && (
              <p className="text-sm text-destructive">{errors.history.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button type="submit" disabled={!isValid || isLoading} size="lg">
          {isLoading ? (
            <>
              <span className="animate-pulse">Processing Clinical Data...</span>
            </>
          ) : (
            "Diagnose"
          )}
        </Button>
      </div>
    </form>
  );
}
