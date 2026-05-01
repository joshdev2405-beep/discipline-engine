import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export function useStrategies() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ["strategies", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategies" as any)
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Strategy[];
    },
  });

  const addStrategy = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name required");
      const { error } = await supabase
        .from("strategies" as any)
        .insert({ user_id: user.id, name: trimmed } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategies", user?.id] });
      toast.success("Strategy added");
    },
    onError: (e: any) => toast.error(e.message || "Failed to add strategy"),
  });

  const removeStrategy = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("strategies" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategies", user?.id] });
      toast.success("Strategy removed");
    },
  });

  return { strategies, isLoading, addStrategy, removeStrategy };
}