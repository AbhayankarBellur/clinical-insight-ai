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
import {
  getDesignations,
  getDegreesForDesignation,
  getSpecializationsForDesignation,
  OTHER_OPTION,
} from "@/data/medicalHierarchy";

const schema = z.object({
  designation: z.string().min(1, "Designation is required"),
  customDesignation: z.string().max(100).optional(),
  degree: z.string().min(1, "Degree is required"),
  customDegree: z.string().max(200).optional(),
  specialization: z.string().min(1, "Specialization is required"),
  customSpecialization: z.string().max(150).optional(),
}).refine((data) => {
  if (data.designation === OTHER_OPTION && !data.customDesignation?.trim()) {
    return false;
  }
  return true;
}, { message: "Please specify designation", path: ["customDesignation"] })
.refine((data) => {
  if (data.degree === OTHER_OPTION && !data.customDegree?.trim()) {
    return false;
  }
  return true;
}, { message: "Please specify degree", path: ["customDegree"] })
.refine((data) => {
  if (data.specialization === OTHER_OPTION && !data.customSpecialization?.trim()) {
    return false;
  }
  return true;
}, { message: "Please specify specialization", path: ["customSpecialization"] });

type FormData = z.infer<typeof schema>;

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
      customDesignation: "",
      degree: "",
      customDegree: "",
      specialization: "",
      customSpecialization: "",
    },
    mode: "onChange",
  });

  const designation = watch("designation");
  const degree = watch("degree");
  const specialization = watch("specialization");

  const designations = getDesignations();
  const degrees = getDegreesForDesignation(designation);
  const specializations = getSpecializationsForDesignation(designation);

  const handleDesignationChange = (value: string) => {
    setValue("designation", value, { shouldValidate: true });
    // Reset degree and specialization when designation changes
    setValue("degree", "", { shouldValidate: true });
    setValue("specialization", "", { shouldValidate: true });
    setValue("customDesignation", "");
    setValue("customDegree", "");
    setValue("customSpecialization", "");
  };

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      designation: data.designation === OTHER_OPTION ? data.customDesignation! : data.designation,
      customDesignation: data.customDesignation,
      degree: data.degree === OTHER_OPTION ? data.customDegree! : data.degree,
      customDegree: data.customDegree,
      specialization: data.specialization === OTHER_OPTION ? data.customSpecialization! : data.specialization,
      customSpecialization: data.customSpecialization,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
              onValueChange={handleDesignationChange}
            >
              <SelectTrigger className="clinical-input">
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {designations.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {designation === OTHER_OPTION && (
              <Input
                {...register("customDesignation")}
                placeholder="Enter custom designation"
                className="clinical-input mt-2"
              />
            )}
            {errors.designation && (
              <p className="text-sm text-destructive">{errors.designation.message}</p>
            )}
            {errors.customDesignation && (
              <p className="text-sm text-destructive">{errors.customDesignation.message}</p>
            )}
          </div>

          {/* Degree */}
          <div className="space-y-2">
            <Label htmlFor="degree">
              Degree <span className="text-destructive">*</span>
            </Label>
            <Select
              value={degree}
              onValueChange={(value) => {
                setValue("degree", value, { shouldValidate: true });
                setValue("customDegree", "");
              }}
              disabled={!designation}
            >
              <SelectTrigger className="clinical-input">
                <SelectValue placeholder={designation ? "Select degree" : "Select designation first"} />
              </SelectTrigger>
              <SelectContent>
                {degrees.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {degree === OTHER_OPTION && (
              <Input
                {...register("customDegree")}
                placeholder="Enter custom degree"
                className="clinical-input mt-2"
              />
            )}
            {errors.degree && (
              <p className="text-sm text-destructive">{errors.degree.message}</p>
            )}
            {errors.customDegree && (
              <p className="text-sm text-destructive">{errors.customDegree.message}</p>
            )}
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <Label htmlFor="specialization">
              Specialization <span className="text-destructive">*</span>
            </Label>
            <Select
              value={specialization}
              onValueChange={(value) => {
                setValue("specialization", value, { shouldValidate: true });
                setValue("customSpecialization", "");
              }}
              disabled={!designation}
            >
              <SelectTrigger className="clinical-input">
                <SelectValue placeholder={designation ? "Select specialization" : "Select designation first"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {specializations.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {specialization === OTHER_OPTION && (
              <Input
                {...register("customSpecialization")}
                placeholder="Enter custom specialization"
                className="clinical-input mt-2"
              />
            )}
            {errors.specialization && (
              <p className="text-sm text-destructive">{errors.specialization.message}</p>
            )}
            {errors.customSpecialization && (
              <p className="text-sm text-destructive">{errors.customSpecialization.message}</p>
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
