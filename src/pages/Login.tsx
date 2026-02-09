import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? "Sign Up Failed" : "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="clinical-card p-8 rounded-2xl shadow-lg text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/favicon.jpeg" alt="Intuition logo" className="w-12 h-12 rounded-xl object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Intuition</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            Clinical Decision Support
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {isSignUp ? "Create your account" : "Sign in to access the clinical workflow engine"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 rounded-xl"
              />
            </div>
            <Button type="submit" size="lg" disabled={submitting} className="w-full rounded-xl h-12 text-sm font-semibold">
              {submitting ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="mt-4 text-sm text-primary hover:underline"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>

          <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
            By signing in, you acknowledge this tool is for decision support only and does not replace clinical judgment.
          </p>
        </div>
      </div>
    </div>
  );
}
