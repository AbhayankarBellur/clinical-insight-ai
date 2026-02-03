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
      {/* Header - Hidden during print */}
      <header className="border-b border-border bg-card app-header no-print">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Intuition
              </h1>
              <p className="text-sm text-muted-foreground">
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

      {/* Footer with disclaimer - Hidden during print (disclaimer shown in results) */}
      <footer className="border-t border-border bg-card mt-auto app-footer no-print">
        <div className="container py-4">
          <MedicalDisclaimer />
        </div>
      </footer>
    </div>
  );
}
