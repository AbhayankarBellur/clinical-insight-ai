import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "@/integrations/supabase/client";

const LOVABLE_PREVIEW_ORIGIN =
  "https://id-preview--b01e7921-16ed-4887-964b-f01a223ce933.lovable.app";

const isLovableDomain =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("lovable.app") ||
    window.location.hostname.includes("lovableproject.com"));

const lovableAuth = createLovableAuth({
  oauthBrokerUrl: isLovableDomain
    ? "/~oauth/initiate"
    : `${LOVABLE_PREVIEW_ORIGIN}/~oauth/initiate`,
});

export async function signInWithGoogle() {
  const result = await lovableAuth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });

  if (result.redirected) return { error: null };
  if (result.error) return { error: result.error };

  try {
    await supabase.auth.setSession(result.tokens);
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
  return { error: null };
}
