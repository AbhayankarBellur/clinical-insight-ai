import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, FileText, Calendar, User, Stethoscope } from "lucide-react";

interface SavedDiagnosis {
  id: string;
  token_id: string;
  doctor_config: {
    designation: string;
    degree: string;
    specialization: string;
  };
  patient_summary: {
    age: number;
    gender: string;
    symptoms: string;
    bp: string;
    o2: number;
    weight: number;
  };
  diagnosis_data: {
    primaryDiagnosis: string[];
    investigativeTests: string[];
    medication: string[];
    furtherProcedures: string[];
  };
  diagnosis_mode: string;
  created_at: string;
}

export default function DiagnosisHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState<SavedDiagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchDiagnoses();
  }, [user]);

  const fetchDiagnoses = async () => {
    const { data, error } = await supabase
      .from("saved_diagnoses")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDiagnoses(data as unknown as SavedDiagnosis[]);
    }
    setLoading(false);
  };

  const filtered = diagnoses.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.token_id.toLowerCase().includes(q) ||
      d.patient_summary.symptoms.toLowerCase().includes(q) ||
      d.doctor_config.specialization.toLowerCase().includes(q)
    );
  });

  const modeLabels: Record<string, string> = {
    pre: "Pre-Diagnosis",
    detailed: "Detailed",
    research: "Research",
  };

  return (
    <AppLayout currentStep={1}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">Past Diagnoses</h1>
            <p className="text-muted-foreground text-sm">Saved diagnostic reports referenced by token ID</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by token ID, symptoms, or specialization..."
            className="clinical-input pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="clinical-card p-12 text-center rounded-2xl">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {search ? "No matching diagnoses" : "No saved diagnoses yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {search ? "Try a different search term" : "Complete a diagnosis and save it to see it here"}
            </p>
            {!search && (
              <Button onClick={() => navigate("/build-doctor")} className="rounded-xl">
                Start New Diagnosis
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((d) => (
              <div key={d.id} className="clinical-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                  className="w-full p-5 text-left hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-primary">{d.token_id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                        {modeLabels[d.diagnosis_mode] || d.diagnosis_mode}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(d.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {d.patient_summary.age}y {d.patient_summary.gender}
                    </span>
                    <span>BP: {d.patient_summary.bp}</span>
                    <span>O2: {d.patient_summary.o2}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                    {d.patient_summary.symptoms}
                  </p>
                </button>

                {expandedId === d.id && (
                  <div className="border-t border-border p-5 space-y-4 bg-accent/10">
                    <div className="text-xs text-muted-foreground mb-2">
                      <Stethoscope className="w-3 h-3 inline mr-1" />
                      {d.doctor_config.designation} ({d.doctor_config.degree}) — {d.doctor_config.specialization}
                    </div>

                    {[
                      { label: "Primary Diagnosis", items: d.diagnosis_data.primaryDiagnosis, color: "border-l-primary" },
                      { label: "Investigative Tests", items: d.diagnosis_data.investigativeTests, color: "border-l-warning" },
                      { label: "Medication", items: d.diagnosis_data.medication, color: "border-l-secondary" },
                      { label: "Further Procedures", items: d.diagnosis_data.furtherProcedures, color: "border-l-accent" },
                    ].map(({ label, items, color }) => (
                      items && items.length > 0 && (
                        <div key={label} className={`border-l-4 ${color} pl-4`}>
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">{label}</h4>
                          <ul className="space-y-1">
                            {items.map((item, i) => (
                              <li key={i} className="text-sm text-muted-foreground">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
