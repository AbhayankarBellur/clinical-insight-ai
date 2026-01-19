import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DoctorConfig } from "@/types/medical";
import { ArrowRight } from "lucide-react";

const schema = z.object({
  designation: z.string().min(1, "Designation is required").max(100),
  degree: z.string().min(1, "Degree is required").max(200),
  specialization: z.string().min(1, "Specialization is required").max(150),
});

type FormData = z.infer<typeof schema>;

const designations = [
  "General Practitioner",
  "Cardiologist",
  "Neurologist",
  "Pulmonologist",
  "Gastroenterologist",
  "Endocrinologist",
  "Nephrologist",
  "Rheumatologist",
  "Infectious Disease Specialist",
  "Oncologist",
  "Pediatrician",
  "Psychiatrist",
  "Emergency Medicine Physician",
  "Internal Medicine Physician",
];

const degrees = [
  "MBBS",
  "MD",
  "DNB",
  "FRCS",
  "MRCP",
  "DM",
  "MCh",
  "MS",
  "DO",
];

const specializations = [
  "General Medicine",
  "Interventional Cardiology",
  "Electrophysiology",
  "Pediatric Neurology",
  "Movement Disorders",
  "Critical Care",
  "Hepatology",
  "Diabetology",
  "Nephrology",
  "Hematology-Oncology",
  "Geriatric Medicine",
  "Sports Medicine",
];

interface DoctorFormProps {
  onSubmit: (data: DoctorConfig) => void;
  defaultValues?: DoctorConfig;
}

export function DoctorForm({ onSubmit, defaultValues }: DoctorFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      designation: "",
      degree: "",
      specialization: "",
    },
    mode: "onChange",
  });

  const designation = watch("designation");
  const specialization = watch("specialization");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="clinical-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">
          Configure AI Doctor Profile
        </h2>

        <div className="space-y-5">
          {/* Designation */}
          <div className="space-y-2">
            <Label htmlFor="designation">
              Designation <span className="text-destructive">*</span>
            </Label>
            <Select
              value={designation}
              onValueChange={(value) => setValue("designation", value, { shouldValidate: true })}
            >
              <SelectTrigger className="clinical-input">
                <SelectValue placeholder="Select or enter designation" />
              </SelectTrigger>
              <SelectContent>
                {designations.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              {...register("designation")}
              placeholder="Or enter custom designation"
              className="clinical-input mt-2"
            />
            {errors.designation && (
              <p className="text-sm text-destructive">{errors.designation.message}</p>
            )}
          </div>

          {/* Degree */}
          <div className="space-y-2">
            <Label htmlFor="degree">
              Degree(s) <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {degrees.map((d) => {
                const currentDegrees = watch("degree").split(", ").filter(Boolean);
                const isSelected = currentDegrees.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      const current = currentDegrees;
                      const updated = isSelected
                        ? current.filter((deg) => deg !== d)
                        : [...current, d];
                      setValue("degree", updated.join(", "), { shouldValidate: true });
                    }}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <Input
              {...register("degree")}
              placeholder="Selected degrees or enter custom"
              className="clinical-input"
            />
            {errors.degree && (
              <p className="text-sm text-destructive">{errors.degree.message}</p>
            )}
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <Label htmlFor="specialization">
              Specialization <span className="text-destructive">*</span>
            </Label>
            <Select
              value={specialization}
              onValueChange={(value) => setValue("specialization", value, { shouldValidate: true })}
            >
              <SelectTrigger className="clinical-input">
                <SelectValue placeholder="Select or enter specialization" />
              </SelectTrigger>
              <SelectContent>
                {specializations.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              {...register("specialization")}
              placeholder="Or enter custom specialization"
              className="clinical-input mt-2"
            />
            {errors.specialization && (
              <p className="text-sm text-destructive">{errors.specialization.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isValid} size="lg">
          Save & Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}
