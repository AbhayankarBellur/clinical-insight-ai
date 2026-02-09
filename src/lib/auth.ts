import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "@/integrations/supabase/client";

const LOVABLE_PREVIEW_ORIGIN = "https://id-preview--b01e7921-16ed-4887-964b-f01a223ce933.lovable.app";

const isLovablePreview = typeof window !== "undefined" && window.location.origin.includes("lovable.app");

const lovableAuth = createLovableAuth({
  oauthBrokerUrl: isLovablePreview
    ? "/~oauth/initiate"
    : `${LOVABLE_PREVIEW_ORIGIN}/~oauth/initiate`,
});

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const auth = {
  signInWithOAuth: async (provider: "google" | "apple", opts?: SignInOptions) => {
    const result = await lovableAuth.signInWithOAuth(provider, {
      redirect_uri: opts?.redirect_uri,
      extraParams: opts?.extraParams,
    });

    if (result.redirected) return result;
    if (result.error) return result;

    try {
      await supabase.auth.setSession(result.tokens);
    } catch (e) {
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
    return result;
  },
};
