import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DailyUsage {
  count: number;
  limit: number;
  remaining: number;
  reset_at_utc: string;
  date_ist: string;
}

export function useDailyRequestUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<DailyUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.rpc("get_daily_request_usage", {
        _user_id: user.id,
      });
      if (!error && data) setUsage(data as unknown as DailyUsage);
    } catch (e) {
      console.error("Failed to fetch daily usage:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { usage, loading, refetch: fetchUsage };
}
