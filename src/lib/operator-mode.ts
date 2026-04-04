import { create } from "zustand";

const ADMIN_EMAIL = "rojosh2405@gmail.com";

interface OperatorModeStore {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}

export const useOperatorModeStore = create<OperatorModeStore>((set) => ({
  enabled: false,
  setEnabled: (v) => set({ enabled: v }),
}));

export function isAdmin(email: string | undefined | null): boolean {
  return !!email && email.toLowerCase() === ADMIN_EMAIL;
}

export function useOperatorMode(email: string | undefined | null) {
  const { enabled, setEnabled } = useOperatorModeStore();
  const admin = isAdmin(email);
  // Safety: if not admin or no email, always false
  return {
    isAdmin: admin,
    operatorMode: admin && enabled,
    setOperatorMode: admin ? setEnabled : () => {},
  };
}
