import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DoctorConfig } from "@/types/medical";

export function useDoctorProfile() {
  const { user } = useAuth();
  const [savedProfile, setSavedProfile] = useState<DoctorConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("doctor_profiles")
      .select("doctor_config")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setSavedProfile(data.doctor_config as unknown as DoctorConfig);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const saveProfile = async (config: DoctorConfig) => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      doctor_config: {
        designation: config.designation,
        degree: config.degree,
        specialization: config.specialization,
        customDesignation: config.customDesignation,
        customDegree: config.customDegree,
        customSpecialization: config.customSpecialization,
      },
    };

    const { error } = await supabase
      .from("doctor_profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (!error) {
      setSavedProfile(config);
    }
    return error;
  };

  return { savedProfile, loading, saveProfile, refetch: fetchProfile };
}
