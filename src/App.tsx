import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DiagnosisProvider } from "./context/DiagnosisContext";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import BuildDoctor from "./pages/BuildDoctor";
import PatientSummary from "./pages/PatientSummary";
import DiagnosisResultsPage from "./pages/DiagnosisResultsPage";
import DiagnosisHistory from "./pages/DiagnosisHistory";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DiagnosisProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/build-doctor" element={<ProtectedRoute><BuildDoctor /></ProtectedRoute>} />
              <Route path="/patient" element={<ProtectedRoute><PatientSummary /></ProtectedRoute>} />
              <Route path="/results" element={<ProtectedRoute><DiagnosisResultsPage /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><DiagnosisHistory /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DiagnosisProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
