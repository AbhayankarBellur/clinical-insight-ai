import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const LOVABLE_HOSTS = ["lovable.app", "lovableproject.com"];

function isLovableDomain(): boolean {
  return LOVABLE_HOSTS.some((host) => window.location.hostname.includes(host));
}

export async function signInWithGoogle() {
  if (isLovableDomain()) {
    // On Lovable domains, use the managed auth bridge
    return lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
  }

  // On custom domains (Vercel, etc.), bypass the auth bridge
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      skipBrowserRedirect: true,
    },
  });

  if (error) return { error };

  if (data?.url) {
    window.location.href = data.url;
    return { error: null, redirected: true as const };
  }

  return { error: new Error("No OAuth URL returned") };
}
