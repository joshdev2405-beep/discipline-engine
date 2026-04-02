import { create } from "zustand";

export type ConditionType = "scale" | "boolean" | "text";

export interface Condition {
  id: string;
  name: string;
  type: ConditionType;
}

export interface ConditionValue {
  conditionId: string;
  value: number | boolean | string;
}

interface ConditionsStore {
  conditions: Condition[];
  addCondition: (condition: Condition) => void;
  updateCondition: (id: string, updates: Partial<Omit<Condition, "id">>) => void;
  removeCondition: (id: string) => void;
}

const CONDITION_TEMPLATES: { type: ConditionType; label: string; example: string }[] = [
  { type: "scale", label: "Scale 1-10", example: "e.g. Sleep Quality, Energy Level" },
  { type: "boolean", label: "Boolean / Toggle", example: "e.g. Drank Water, Exercised" },
  { type: "text", label: "Text Note", example: "e.g. Pre-market Observation" },
];

const loadConditions = (): Condition[] => {
  try {
    const saved = localStorage.getItem("trade-tracker-conditions");
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

const persist = (conditions: Condition[]) => {
  localStorage.setItem("trade-tracker-conditions", JSON.stringify(conditions));
};

export const useConditions = create<ConditionsStore>((set) => ({
  conditions: loadConditions(),
  addCondition: (condition) =>
    set((state) => {
      const next = [...state.conditions, condition];
      persist(next);
      return { conditions: next };
    }),
  updateCondition: (id, updates) =>
    set((state) => {
      const next = state.conditions.map((c) => (c.id === id ? { ...c, ...updates } : c));
      persist(next);
      return { conditions: next };
    }),
  removeCondition: (id) =>
    set((state) => {
      const next = state.conditions.filter((c) => c.id !== id);
      persist(next);
      return { conditions: next };
    }),
}));

export { CONDITION_TEMPLATES };
