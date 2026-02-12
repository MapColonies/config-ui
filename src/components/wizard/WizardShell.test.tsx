import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useWizardStore } from "@/stores/wizardStore";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  createFileRoute: () => ({
    useSearch: () => ({ mode: "create" }),
  }),
}));

vi.mock("@/lib/api", () => ({
  $api: {
    useMutation: vi.fn(() => ({
      mutateAsync: vi.fn(),
    })),
  },
  api: {
    GET: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("WizardShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWizardStore.getState().reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rollback mode initialization", () => {
    it("should initialize at step 4 for rollback mode", () => {
      const { initializeForRollback } = useWizardStore.getState();
      
      initializeForRollback(
        "test-config",
        "https://example.com/schema",
        '{"test": true}',
        3
      );

      const state = useWizardStore.getState();
      expect(state.mode).toBe("rollback");
      expect(state.currentStep).toBe(4);
      expect(state.configName).toBe("test-config");
      expect(state.rollbackFromVersion).toBe(3);
    });

    it("should allow navigation back to step 3 from step 4 in rollback mode", () => {
      const { initializeForRollback, prevStep } = useWizardStore.getState();
      
      initializeForRollback("test", "https://schema", "{}", 5);
      expect(useWizardStore.getState().currentStep).toBe(4);
      
      prevStep();
      expect(useWizardStore.getState().currentStep).toBe(3);
    });

    it("should not allow navigation back past step 3 in rollback mode", () => {
      const { initializeForRollback, setCurrentStep, prevStep } = useWizardStore.getState();
      
      initializeForRollback("test", "https://schema", "{}", 5);
      setCurrentStep(3);
      
      prevStep();
      expect(useWizardStore.getState().currentStep).toBe(3);
    });
  });

  describe("Edit mode initialization", () => {
    it("should initialize at step 3 for edit mode", () => {
      const { initializeForEdit } = useWizardStore.getState();
      
      initializeForEdit(
        "test-config",
        "https://example.com/schema",
        '{"edit": true}'
      );

      const state = useWizardStore.getState();
      expect(state.mode).toBe("edit");
      expect(state.currentStep).toBe(3);
      expect(state.configName).toBe("test-config");
    });

    it("should allow navigation back to step 3 but not past it in edit mode", () => {
      const { initializeForEdit, setCurrentStep, prevStep } = useWizardStore.getState();
      
      initializeForEdit("test", "https://schema", "{}");
      setCurrentStep(4);
      
      prevStep();
      expect(useWizardStore.getState().currentStep).toBe(3);
      
      prevStep();
      expect(useWizardStore.getState().currentStep).toBe(3);
    });
  });

  describe("Step validation", () => {
    it("should track step validation state correctly", () => {
      const { setStepValid, stepValidation } = useWizardStore.getState();
      
      expect(stepValidation.step1Valid).toBe(false);
      expect(stepValidation.step2Valid).toBe(false);
      expect(stepValidation.step3Valid).toBe(false);
      
      setStepValid(1, true);
      expect(useWizardStore.getState().stepValidation.step1Valid).toBe(true);
      
      setStepValid(2, true);
      expect(useWizardStore.getState().stepValidation.step2Valid).toBe(true);
      
      setStepValid(3, true);
      expect(useWizardStore.getState().stepValidation.step3Valid).toBe(true);
    });
  });

  describe("Content management", () => {
    it("should update JSON content", () => {
      const { setJsonContent } = useWizardStore.getState();
      const content = '{"key": "value"}';
      
      setJsonContent(content);
      expect(useWizardStore.getState().jsonContent).toBe(content);
    });

    it("should preserve original content for diff comparison", () => {
      const { initializeForEdit, setJsonContent } = useWizardStore.getState();
      const original = '{"original": true}';
      const modified = '{"modified": true}';
      
      initializeForEdit("test", "https://schema", original);
      expect(useWizardStore.getState().originalJsonContent).toBe(original);
      
      setJsonContent(modified);
      expect(useWizardStore.getState().jsonContent).toBe(modified);
      expect(useWizardStore.getState().originalJsonContent).toBe(original);
    });
  });

  describe("Wizard reset", () => {
    it("should reset all state to initial values", () => {
      const {
        initializeForEdit,
        setStepValid,
        setJsonContent,
        reset,
      } = useWizardStore.getState();
      
      // Make changes
      initializeForEdit("test", "https://schema", '{"test": true}');
      setStepValid(1, true);
      setStepValid(2, true);
      setStepValid(3, true);
      setJsonContent('{"changed": true}');
      
      // Verify changes
      expect(useWizardStore.getState().mode).toBe("edit");
      expect(useWizardStore.getState().currentStep).toBe(3);
      
      // Reset
      reset();
      
      // Verify reset
      const state = useWizardStore.getState();
      expect(state.mode).toBe("create");
      expect(state.currentStep).toBe(1);
      expect(state.configName).toBeNull();
      expect(state.schemaId).toBeNull();
      expect(state.jsonContent).toBe("{}");
      expect(state.originalJsonContent).toBeNull();
      expect(state.rollbackFromVersion).toBeNull();
      expect(state.stepValidation.step1Valid).toBe(false);
      expect(state.stepValidation.step2Valid).toBe(false);
      expect(state.stepValidation.step3Valid).toBe(false);
    });
  });
});
