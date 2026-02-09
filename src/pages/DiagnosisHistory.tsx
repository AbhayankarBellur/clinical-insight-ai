import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Calendar, User, Stethoscope, AlertTriangle } from "lucide-react";

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
    purgeAndFetch();
  }, [user]);

  const purgeAndFetch = async () => {
    // Purge diagnoses older than 7 days
    await supabase.rpc("purge_old_diagnoses");
    
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

  const getDaysRemaining = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiry = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">Past Diagnoses</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Saved diagnostic reports referenced by token ID</p>
        </div>

        {/* 7-day purge notice */}
        <div className="mb-4 p-2.5 bg-warning/5 border border-warning/20 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            Records are automatically purged 7 days after creation.
          </p>
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
          <div className="clinical-card p-8 sm:p-12 text-center rounded-2xl">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              {search ? "No matching diagnoses" : "No saved diagnoses yet"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6">
              {search ? "Try a different search term" : "Complete a diagnosis and save it to see it here"}
            </p>
            {!search && (
              <Button onClick={() => navigate("/build-doctor")} className="rounded-xl">
                Start New Diagnosis
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filtered.map((d) => {
              const daysLeft = getDaysRemaining(d.created_at);
              return (
                <div key={d.id} className="clinical-card rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    className="w-full p-4 sm:p-5 text-left hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-mono font-semibold text-primary">{d.token_id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                          {modeLabels[d.diagnosis_mode] || d.diagnosis_mode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-medium ${daysLeft <= 2 ? "text-destructive" : "text-muted-foreground"}`}>
                          {daysLeft}d left
                        </span>
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(d.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {d.patient_summary.age}y {d.patient_summary.gender}
                      </span>
                      <span>BP: {d.patient_summary.bp}</span>
                      <span>O2: {d.patient_summary.o2}%</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-1">
                      {d.patient_summary.symptoms}
                    </p>
                  </button>

                  {expandedId === d.id && (
                    <div className="border-t border-border p-4 sm:p-5 space-y-4 bg-accent/10">
                      <div className="text-[10px] sm:text-xs text-muted-foreground mb-2">
                        <Stethoscope className="w-3 h-3 inline mr-1" />
                        {d.doctor_config.designation} ({d.doctor_config.degree}) — {d.doctor_config.specialization}
                      </div>

                      {[
                        { label: "Primary Diagnosis", items: d.diagnosis_data.primaryDiagnosis, color: "border-l-primary" },
                        { label: "Investigative Tests", items: d.diagnosis_data.investigativeTests, color: "border-l-warning" },
                        { label: "Medication", items: d.diagnosis_data.medication, color: "border-l-success" },
                        { label: "Further Procedures", items: d.diagnosis_data.furtherProcedures, color: "border-l-accent-foreground" },
                      ].map(({ label, items, color }) => (
                        items && items.length > 0 && (
                          <div key={label} className={`border-l-4 ${color} pl-3 sm:pl-4`}>
                            <h4 className="text-[10px] sm:text-xs font-semibold text-foreground uppercase tracking-wider mb-1">{label}</h4>
                            <ul className="space-y-1">
                              {items.map((item, i) => (
                                <li key={i} className="text-xs sm:text-sm text-muted-foreground">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
