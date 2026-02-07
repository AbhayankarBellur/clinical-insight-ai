import { ReactNode } from "react";
import { StepIndicator } from "./StepIndicator";
import { MedicalDisclaimer } from "./MedicalDisclaimer";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Activity } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  currentStep: 1 | 2 | 3;
}

export function AppLayout({ children, currentStep }: AppLayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm app-header no-print sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Intuition
                </h1>
                <p className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase">
                  Clinical Decision Support
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <StepIndicator currentStep={currentStep} />
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-muted-foreground hover:text-foreground ml-2"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-auto app-footer no-print">
        <div className="container py-4">
          <MedicalDisclaimer />
        </div>
      </footer>
    </div>
  );
}
