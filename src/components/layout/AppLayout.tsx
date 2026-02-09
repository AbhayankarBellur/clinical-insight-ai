import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MedicalDisclaimer } from "./MedicalDisclaimer";
import { useAuth } from "@/hooks/useAuth";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { DoctorForm } from "@/components/forms/DoctorForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, Home, UserCircle, CheckCircle } from "lucide-react";
import { DoctorConfig } from "@/types/medical";
import { useToast } from "@/hooks/use-toast";

interface AppLayoutProps {
  children: ReactNode;
  currentStep?: 1 | 2 | 3;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { savedProfile, saveProfile } = useDoctorProfile();
  const { setDoctor } = useDiagnosis();
  const { toast } = useToast();
  const [profileOpen, setProfileOpen] = useState(false);

  const isHome = location.pathname === "/";

  const handleSaveProfile = async (config: DoctorConfig) => {
    const error = await saveProfile(config);
    if (!error) {
      setDoctor(config);
      setProfileOpen(false);
      toast({ title: "Profile Saved", description: "Your AI doctor config has been saved." });
    } else {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm app-header no-print sticky top-0 z-40">
        <div className="container py-3 px-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/favicon.jpeg" alt="Intuition" className="w-8 h-8 rounded-lg object-contain" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-foreground tracking-tight leading-none">
                  Intuition
                </h1>
                <p className="text-[9px] text-muted-foreground font-semibold tracking-widest uppercase">
                  Clinical Decision Support
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              {!isHome && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
                  <Home className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline text-xs">Home</span>
                </Button>
              )}
              {user && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setProfileOpen(true)} className="text-muted-foreground hover:text-foreground relative">
                    <UserCircle className="w-4 h-4" />
                    {savedProfile && (
                      <CheckCircle className="w-2.5 h-2.5 text-success absolute -top-0.5 -right-0.5" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container py-6 px-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-auto app-footer no-print">
        <div className="container py-3 px-4">
          <MedicalDisclaimer />
        </div>
      </footer>

      {/* Doctor Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Doctor Profile</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Save your default AI doctor configuration. This will be pre-loaded each time you start a new diagnosis.
          </p>
          <DoctorForm onSubmit={handleSaveProfile} defaultValues={savedProfile || undefined} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
