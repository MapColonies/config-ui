import { create } from "zustand";

/**
 * Wizard modes determine the flow and initial state
 */
export type WizardMode = "create" | "edit" | "rollback";

/**
 * Wizard steps (1-indexed to match UI)
 */
export type WizardStep = 1 | 2 | 3 | 4;

/**
 * State for the config creation/editing wizard
 */
interface WizardState {
  // Core state
  mode: WizardMode;
  currentStep: WizardStep;
  schemaId: string | null;
  configName: string | null;
  jsonContent: string;
  originalJsonContent: string | null;
  rollbackFromVersion: number | null; // Track which version we're rolling back from

  // Validation state for each step
  stepValidation: {
    step1Valid: boolean;
    step2Valid: boolean;
    step3Valid: boolean;
  };

  // Actions
  setMode: (mode: WizardMode) => void;
  setCurrentStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSchemaId: (schemaId: string) => void;
  setConfigName: (name: string) => void;
  setJsonContent: (content: string) => void;
  setStepValid: (step: 1 | 2 | 3, isValid: boolean) => void;
  setOriginalJsonContent: (content: string) => void;
  reset: () => void;

  // Initialization for EDIT/ROLLBACK modes
  initializeForEdit: (
    configName: string,
    schemaId: string,
    content: string,
  ) => void;
  initializeForRollback: (
    configName: string,
    schemaId: string,
    content: string,
    rollbackFromVersion: number,
  ) => void;
}

const initialState = {
  mode: "create" as WizardMode,
  currentStep: 1 as WizardStep,
  schemaId: null,
  configName: null,
  jsonContent: "{}",
  originalJsonContent: null,
  rollbackFromVersion: null,
  stepValidation: {
    step1Valid: false,
    step2Valid: false,
    step3Valid: false,
  },
};

/**
 * Wizard store for managing config creation/editing flow
 *
 * Modes:
 * - CREATE: Start at Step 1 (Select Schema)
 * - EDIT: Skip to Step 3 (Author Content) with pre-loaded content
 * - ROLLBACK: Skip to Step 3 (Author Content) with pre-loaded content
 */
export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),

  setCurrentStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 4) {
      set({ currentStep: (currentStep + 1) as WizardStep });
    }
  },

  prevStep: () => {
    const { currentStep, mode } = get();
    // In EDIT/ROLLBACK modes, can't go back past Step 3
    const minStep = mode === "create" ? 1 : 3;
    if (currentStep > minStep) {
      set({ currentStep: (currentStep - 1) as WizardStep });
    }
  },

  setSchemaId: (schemaId) => set({ schemaId }),

  setConfigName: (configName) => set({ configName }),

  setJsonContent: (content) => set({ jsonContent: content }),

  setStepValid: (step, isValid) => {
    set((state) => ({
      stepValidation: {
        ...state.stepValidation,
        [`step${step}Valid`]: isValid,
      },
    }));
  },

  setOriginalJsonContent: (content) => set({ originalJsonContent: content }),

  reset: () => set(initialState),

  initializeForEdit: (configName, schemaId, content) => {
    set({
      ...initialState,
      mode: "edit",
      currentStep: 3,
      configName,
      schemaId,
      jsonContent: content,
      originalJsonContent: content,
    });
  },

  initializeForRollback: (
    configName,
    schemaId,
    content,
    rollbackFromVersion,
  ) => {
    set({
      ...initialState,
      mode: "rollback",
      currentStep: 4,
      configName,
      schemaId,
      jsonContent: content,
      originalJsonContent: content,
      rollbackFromVersion,
    });
  },
}));
