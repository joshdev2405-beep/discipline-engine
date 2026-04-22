import { supabase } from "@/integrations/supabase/client";

export async function checkSession(): Promise<{
  isAuthenticated: boolean;
  userId: string | null;
}> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Session check error:", error);
      return { isAuthenticated: false, userId: null };
    }

    if (session?.user) {
      return {
        isAuthenticated: true,
        userId: session.user.id,
      };
    }

    return { isAuthenticated: false, userId: null };
  } catch (err) {
    console.error("Failed to check session:", err);
    return { isAuthenticated: false, userId: null };
  }
}

export function initializeSessionSync(): () => void {
  const unsubscribe = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN") {
      console.log("User signed in:", session?.user.email);
    } else if (event === "SIGNED_OUT") {
      console.log("User signed out");
    } else if (event === "TOKEN_REFRESHED") {
      console.log("Session refreshed");
    }
  });

  return unsubscribe.data.subscription.unsubscribe;
}
