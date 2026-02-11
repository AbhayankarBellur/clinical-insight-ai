import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Share2, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ShareDiagnosisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagnosisId: string;
  tokenId: string;
}

export function ShareDiagnosisDialog({ open, onOpenChange, diagnosisId, tokenId }: ShareDiagnosisDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "found" | "not_found" | "shared">("idle");
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setStatus("idle");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("lookup-doctor", {
        body: { email: email.trim() },
      });

      if (res.error) {
        toast({ title: "Lookup failed", description: res.error.message, variant: "destructive" });
        setStatus("not_found");
      } else if (res.data?.found) {
        setTargetUserId(res.data.user_id);
        setStatus("found");
      } else if (res.data?.error) {
        toast({ title: "Error", description: res.data.error, variant: "destructive" });
        setStatus("not_found");
      } else {
        setStatus("not_found");
      }
    } catch {
      setStatus("not_found");
    }
    setLoading(false);
  };

  const handleShare = async () => {
    if (!targetUserId) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("diagnosis_shares").insert({
      diagnosis_id: diagnosisId,
      shared_by: user.id,
      shared_with: targetUserId,
    } as any);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already shared", description: "This diagnosis is already shared with that doctor." });
      } else {
        toast({ title: "Share failed", description: error.message, variant: "destructive" });
      }
    } else {
      setStatus("shared");
      toast({ title: "Shared!", description: `Diagnosis ${tokenId} shared successfully.` });
    }
    setLoading(false);
  };

  const handleClose = () => {
    setEmail("");
    setStatus("idle");
    setTargetUserId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Diagnosis
          </DialogTitle>
          <DialogDescription>
            Share <span className="font-mono font-semibold text-primary">{tokenId}</span> with another registered doctor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <Input
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
              placeholder="Enter doctor's email..."
              type="email"
              className="clinical-input"
              disabled={status === "shared"}
            />
            <Button
              onClick={handleLookup}
              disabled={loading || !email.trim() || status === "shared"}
              variant="outline"
              className="rounded-xl flex-shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
            </Button>
          </div>

          {status === "not_found" && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="w-4 h-4" />
              Doctor not found in system. Verify the email address.
            </div>
          )}

          {status === "found" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle className="w-4 h-4" />
                Doctor verified in system.
              </div>
              <Button onClick={handleShare} disabled={loading} className="w-full rounded-xl">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                Confirm Share
              </Button>
            </div>
          )}

          {status === "shared" && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle className="w-4 h-4" />
              Diagnosis shared successfully!
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
