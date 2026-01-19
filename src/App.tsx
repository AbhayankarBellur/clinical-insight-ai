import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DiagnosisProvider } from "./context/DiagnosisContext";
import BuildDoctor from "./pages/BuildDoctor";
import PatientSummary from "./pages/PatientSummary";
import DiagnosisResultsPage from "./pages/DiagnosisResultsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DiagnosisProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<BuildDoctor />} />
            <Route path="/patient" element={<PatientSummary />} />
            <Route path="/results" element={<DiagnosisResultsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DiagnosisProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
