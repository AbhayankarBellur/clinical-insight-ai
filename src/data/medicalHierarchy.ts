/**
 * Medical Hierarchy Configuration
 * Designation → Allowed Degrees → Allowed Specializations
 * Each category includes "Other — Specify" option for custom entries
 */

export interface MedicalHierarchyEntry {
  degrees: string[];
  specializations: string[];
}

export const medicalHierarchy: Record<string, MedicalHierarchyEntry> = {
  "General Practitioner": {
    degrees: ["MBBS", "MD", "DO", "DNB"],
    specializations: [
      "General Medicine",
      "Family Medicine",
      "Primary Care",
      "Rural Medicine",
      "Preventive Medicine",
    ],
  },
  "Cardiologist": {
    degrees: ["MD", "DM", "DNB", "MRCP", "FACC"],
    specializations: [
      "Interventional Cardiology",
      "Electrophysiology",
      "Heart Failure & Transplant",
      "Preventive Cardiology",
      "Pediatric Cardiology",
      "Cardiac Imaging",
    ],
  },
  "Neurologist": {
    degrees: ["MD", "DM", "DNB", "MRCP"],
    specializations: [
      "Pediatric Neurology",
      "Movement Disorders",
      "Epilepsy",
      "Neuromuscular Medicine",
      "Stroke & Vascular Neurology",
      "Neuro-oncology",
      "Headache Medicine",
    ],
  },
  "Pulmonologist": {
    degrees: ["MD", "DM", "DNB", "MRCP"],
    specializations: [
      "Critical Care",
      "Interventional Pulmonology",
      "Sleep Medicine",
      "Pulmonary Hypertension",
      "Lung Transplant",
      "Occupational Lung Disease",
    ],
  },
  "Gastroenterologist": {
    degrees: ["MD", "DM", "DNB", "MRCP"],
    specializations: [
      "Hepatology",
      "Interventional Gastroenterology",
      "Inflammatory Bowel Disease",
      "Motility Disorders",
      "Pancreaticobiliary Medicine",
      "Pediatric Gastroenterology",
    ],
  },
  "Endocrinologist": {
    degrees: ["MD", "DM", "DNB", "MRCP"],
    specializations: [
      "Diabetology",
      "Thyroid Disorders",
      "Reproductive Endocrinology",
      "Pediatric Endocrinology",
      "Adrenal Disorders",
      "Bone & Mineral Metabolism",
    ],
  },
  "Nephrologist": {
    degrees: ["MD", "DM", "DNB", "MRCP"],
    specializations: [
      "Dialysis & Transplant",
      "Glomerular Disease",
      "Hypertension",
      "Pediatric Nephrology",
      "Critical Care Nephrology",
      "Interventional Nephrology",
    ],
  },
  "Rheumatologist": {
    degrees: ["MD", "DM", "DNB", "MRCP"],
    specializations: [
      "Autoimmune Diseases",
      "Inflammatory Arthritis",
      "Osteoporosis",
      "Pediatric Rheumatology",
      "Vasculitis",
      "Connective Tissue Disorders",
    ],
  },
  "Infectious Disease Specialist": {
    degrees: ["MD", "DM", "DNB", "MRCP"],
    specializations: [
      "HIV/AIDS Medicine",
      "Tropical Medicine",
      "Hospital Epidemiology",
      "Antimicrobial Stewardship",
      "Travel Medicine",
      "Transplant Infectious Disease",
    ],
  },
  "Oncologist": {
    degrees: ["MD", "DM", "DNB", "MRCP"],
    specializations: [
      "Hematology-Oncology",
      "Surgical Oncology",
      "Radiation Oncology",
      "Pediatric Oncology",
      "Neuro-oncology",
      "Breast Oncology",
      "Gastrointestinal Oncology",
    ],
  },
  "Pediatrician": {
    degrees: ["MD", "DNB", "DCH", "MRCPCH"],
    specializations: [
      "Neonatology",
      "Pediatric Critical Care",
      "Developmental Pediatrics",
      "Pediatric Cardiology",
      "Pediatric Pulmonology",
      "Pediatric Gastroenterology",
      "Pediatric Neurology",
    ],
  },
  "Psychiatrist": {
    degrees: ["MD", "DNB", "MRCPsych"],
    specializations: [
      "Child & Adolescent Psychiatry",
      "Geriatric Psychiatry",
      "Addiction Psychiatry",
      "Forensic Psychiatry",
      "Consultation-Liaison Psychiatry",
      "Neuropsychiatry",
    ],
  },
  "Emergency Medicine Physician": {
    degrees: ["MD", "DNB", "MRCEM", "FACEM"],
    specializations: [
      "Trauma & Critical Care",
      "Toxicology",
      "Pediatric Emergency Medicine",
      "Pre-hospital Medicine",
      "Disaster Medicine",
      "Ultrasound in Emergency Medicine",
    ],
  },
  "Internal Medicine Physician": {
    degrees: ["MD", "DNB", "MRCP"],
    specializations: [
      "Hospital Medicine",
      "Geriatric Medicine",
      "Palliative Medicine",
      "Critical Care Medicine",
      "Sports Medicine",
      "Adolescent Medicine",
    ],
  },
  "Surgeon": {
    degrees: ["MS", "MCh", "FRCS", "DNB"],
    specializations: [
      "General Surgery",
      "Cardiothoracic Surgery",
      "Neurosurgery",
      "Orthopedic Surgery",
      "Plastic Surgery",
      "Vascular Surgery",
      "Pediatric Surgery",
      "Surgical Oncology",
    ],
  },
  "Dermatologist": {
    degrees: ["MD", "DNB", "MRCP"],
    specializations: [
      "Cosmetic Dermatology",
      "Dermatopathology",
      "Pediatric Dermatology",
      "Mohs Surgery",
      "Immunodermatology",
    ],
  },
  "Ophthalmologist": {
    degrees: ["MS", "DNB", "FRCS"],
    specializations: [
      "Retina & Vitreous",
      "Glaucoma",
      "Cornea & Refractive Surgery",
      "Pediatric Ophthalmology",
      "Oculoplastics",
      "Neuro-ophthalmology",
    ],
  },
  "Orthopedic Surgeon": {
    degrees: ["MS", "MCh", "DNB", "FRCS"],
    specializations: [
      "Joint Replacement",
      "Sports Medicine",
      "Spine Surgery",
      "Pediatric Orthopedics",
      "Trauma Surgery",
      "Hand Surgery",
    ],
  },
};

export const OTHER_OPTION = "Other — Specify";

export function getDesignations(): string[] {
  return [...Object.keys(medicalHierarchy), OTHER_OPTION];
}

export function getDegreesForDesignation(designation: string): string[] {
  if (designation === OTHER_OPTION || !medicalHierarchy[designation]) {
    return [OTHER_OPTION];
  }
  return [...medicalHierarchy[designation].degrees, OTHER_OPTION];
}

export function getSpecializationsForDesignation(designation: string): string[] {
  if (designation === OTHER_OPTION || !medicalHierarchy[designation]) {
    return [OTHER_OPTION];
  }
  return [...medicalHierarchy[designation].specializations, OTHER_OPTION];
}
