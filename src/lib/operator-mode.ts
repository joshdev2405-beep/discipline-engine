import { create } from "zustand";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OperatorModeStore {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}

export const useOperatorModeStore = create<OperatorModeStore>((set) => ({
  enabled: false,
  setEnabled: (v) => set({ enabled: v }),
}));

/**
 * Server-verified admin check. Calls the `is_admin()` RPC which wraps
 * `has_role(auth.uid(), 'admin')` so privileged identity never leaks
 * to the client bundle.
 */
export function useIsAdmin(userId: string | undefined | null) {
  const { data } = useQuery({
    queryKey: ["is_admin", userId],
    queryFn: async () => {
      const sb = supabase as any;
      const { data, error } = await sb.rpc("is_admin");
      if (error) return false;
      return !!data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
  return !!data;
}

export function useOperatorMode(userId: string | undefined | null) {
  const { enabled, setEnabled } = useOperatorModeStore();
  const admin = useIsAdmin(userId);
  return {
    isAdmin: admin,
    operatorMode: admin && enabled,
    setOperatorMode: admin ? setEnabled : () => {},
  };
}
