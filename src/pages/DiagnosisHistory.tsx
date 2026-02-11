import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, Calendar, User, Stethoscope, AlertTriangle, Share2 } from "lucide-react";
import { ShareDiagnosisDialog } from "@/components/results/ShareDiagnosisDialog";

interface SavedDiagnosis {
  id: string;
  token_id: string;
  user_id: string;
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
  approved_items?: Record<string, number[]> | null;
}

export default function DiagnosisHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState<SavedDiagnosis[]>([]);
  const [sharedDiagnoses, setSharedDiagnoses] = useState<SavedDiagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ id: string; tokenId: string } | null>(null);
  const [activeTab, setActiveTab] = useState("mine");

  useEffect(() => {
    if (!user) return;
    purgeAndFetch();
  }, [user]);

  const purgeAndFetch = async () => {
    await supabase.rpc("purge_old_diagnoses");

    // Fetch all accessible diagnoses (own + shared via RLS)
    const { data, error } = await supabase
      .from("saved_diagnoses")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const all = data as unknown as SavedDiagnosis[];
      setDiagnoses(all.filter((d) => d.user_id === user!.id));
      setSharedDiagnoses(all.filter((d) => d.user_id !== user!.id));
    }
    setLoading(false);
  };

  const filterList = (list: SavedDiagnosis[]) => {
    const q = search.toLowerCase();
    if (!q) return list;
    return list.filter((d) =>
      d.token_id.toLowerCase().includes(q) ||
      d.patient_summary.symptoms.toLowerCase().includes(q) ||
      d.doctor_config.specialization.toLowerCase().includes(q)
    );
  };

  const modeLabels: Record<string, string> = {
    pre: "Pre-Diagnosis",
    detailed: "Detailed",
    research: "Research",
  };

  const getDaysRemaining = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiry = new Date(created.getTime() + 15 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const handleShare = (id: string, tokenId: string) => {
    setShareTarget({ id, tokenId });
    setShareDialogOpen(true);
  };

  const renderDiagnosisList = (list: SavedDiagnosis[], isShared = false) => {
    const filtered = filterList(list);
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="clinical-card p-8 sm:p-12 text-center rounded-2xl">
          <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
            {search ? "No matching diagnoses" : isShared ? "No shared diagnoses" : "No saved diagnoses yet"}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6">
            {search ? "Try a different search term" : isShared ? "Other doctors haven't shared any diagnoses with you yet" : "Complete a diagnosis and save it to see it here"}
          </p>
          {!search && !isShared && (
            <Button onClick={() => navigate("/build-doctor")} className="rounded-xl">
              Start New Diagnosis
            </Button>
          )}
        </div>
      );
    }

    return (
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
                    {isShared && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Shared
                      </span>
                    )}
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
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      <Stethoscope className="w-3 h-3 inline mr-1" />
                      {d.doctor_config.designation} ({d.doctor_config.degree}) — {d.doctor_config.specialization}
                    </div>
                    {!isShared && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs"
                        onClick={(e) => { e.stopPropagation(); handleShare(d.id, d.token_id); }}
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Share
                      </Button>
                    )}
                  </div>

                  {[
                    { label: "Primary Diagnosis", items: d.diagnosis_data.primaryDiagnosis, color: "border-l-primary", key: "primaryDiagnosis" },
                    { label: "Investigative Tests", items: d.diagnosis_data.investigativeTests, color: "border-l-warning", key: "investigativeTests" },
                    { label: "Medication", items: d.diagnosis_data.medication, color: "border-l-success", key: "medication" },
                    { label: "Further Procedures", items: d.diagnosis_data.furtherProcedures, color: "border-l-accent-foreground", key: "furtherProcedures" },
                  ].map(({ label, items, color, key }) => (
                    items && items.length > 0 && (
                      <div key={label} className={`border-l-4 ${color} pl-3 sm:pl-4`}>
                        <h4 className="text-[10px] sm:text-xs font-semibold text-foreground uppercase tracking-wider mb-1">{label}</h4>
                        <ul className="space-y-1">
                          {items.map((item, i) => {
                            const isApproved = d.approved_items?.[key]?.includes(i);
                            return (
                              <li key={i} className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                                {item}
                                {isApproved && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase">
                                    Approved
                                  </span>
                                )}
                              </li>
                            );
                          })}
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
    );
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">Past Diagnoses</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Saved diagnostic reports referenced by token ID</p>
        </div>

        <div className="mb-4 p-2.5 bg-warning/5 border border-warning/20 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            Records are automatically purged 15 days after creation.
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by token ID, symptoms, or specialization..."
            className="clinical-input pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
            <TabsTrigger value="mine" className="text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
              My Diagnoses
            </TabsTrigger>
            <TabsTrigger value="shared" className="text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Share2 className="w-3 h-3 mr-1" />
              Shared With Me
              {sharedDiagnoses.length > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {sharedDiagnoses.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="mt-0">
            {renderDiagnosisList(diagnoses, false)}
          </TabsContent>

          <TabsContent value="shared" className="mt-0">
            {renderDiagnosisList(sharedDiagnoses, true)}
          </TabsContent>
        </Tabs>
      </div>

      {shareTarget && (
        <ShareDiagnosisDialog
          open={shareDialogOpen}
          onOpenChange={(open) => { setShareDialogOpen(open); if (!open) setShareTarget(null); }}
          diagnosisId={shareTarget.id}
          tokenId={shareTarget.tokenId}
        />
      )}
    </AppLayout>
  );
}
