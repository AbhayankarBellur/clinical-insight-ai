import { ReactNode } from "react";
import { StepIndicator } from "./StepIndicator";
import { MedicalDisclaimer } from "./MedicalDisclaimer";

interface AppLayoutProps {
  children: ReactNode;
  currentStep: 1 | 2 | 3;
}

export function AppLayout({ children, currentStep }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm app-header no-print sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Intuition
              </h1>
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                Clinical Decision Support
              </p>
            </div>
            <StepIndicator currentStep={currentStep} />
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