import { describe, it, expect, beforeEach } from "vitest";
import { useWizardStore } from "./wizardStore";

describe("wizardStore", () => {
  beforeEach(() => {
    const { reset } = useWizardStore.getState();
    reset();
  });

  describe("Initial State", () => {
    it("should initialize with CREATE mode", () => {
      const { mode } = useWizardStore.getState();
      expect(mode).toBe("create");
    });

    it("should start at step 1", () => {
      const { currentStep } = useWizardStore.getState();
      expect(currentStep).toBe(1);
    });

    it("should have empty content fields", () => {
      const { schemaId, configName, jsonContent, originalJsonContent } =
        useWizardStore.getState();
      expect(schemaId).toBeNull();
      expect(configName).toBeNull();
      expect(jsonContent).toBe("{}");
      expect(originalJsonContent).toBeNull();
    });

    it("should have all steps invalid initially", () => {
      const { stepValidation } = useWizardStore.getState();
      expect(stepValidation.step1Valid).toBe(false);
      expect(stepValidation.step2Valid).toBe(false);
      expect(stepValidation.step3Valid).toBe(false);
    });
  });

  describe("Step Navigation", () => {
    it("should advance to next step", () => {
      const { nextStep, currentStep } = useWizardStore.getState();
      expect(currentStep).toBe(1);

      nextStep();
      expect(useWizardStore.getState().currentStep).toBe(2);

      useWizardStore.getState().nextStep();
      expect(useWizardStore.getState().currentStep).toBe(3);
    });

    it("should not advance past step 4", () => {
      const { setCurrentStep, nextStep } = useWizardStore.getState();
      setCurrentStep(4);

      nextStep();
      expect(useWizardStore.getState().currentStep).toBe(4);
    });

    it("should go back to previous step", () => {
      const { setCurrentStep, prevStep } = useWizardStore.getState();
      setCurrentStep(3);

      prevStep();
      expect(useWizardStore.getState().currentStep).toBe(2);
    });

    it("should not go back past step 1 in CREATE mode", () => {
      const { prevStep } = useWizardStore.getState();
      // Already at step 1
      prevStep();
      expect(useWizardStore.getState().currentStep).toBe(1);
    });

    it("should not go back past step 3 in EDIT mode", () => {
      const { setMode, setCurrentStep, prevStep } = useWizardStore.getState();
      setMode("edit");
      setCurrentStep(3);

      prevStep();
      expect(useWizardStore.getState().currentStep).toBe(3);
    });

    it("should not go back past step 3 in ROLLBACK mode", () => {
      const { setMode, setCurrentStep, prevStep } = useWizardStore.getState();
      setMode("rollback");
      setCurrentStep(3);

      prevStep();
      expect(useWizardStore.getState().currentStep).toBe(3);
    });

    it("should set current step directly", () => {
      const { setCurrentStep } = useWizardStore.getState();
      setCurrentStep(3);
      expect(useWizardStore.getState().currentStep).toBe(3);
    });
  });

  describe("State Updates", () => {
    it("should update schema ID", () => {
      const { setSchemaId } = useWizardStore.getState();
      setSchemaId("https://example.com/schema");
      expect(useWizardStore.getState().schemaId).toBe(
        "https://example.com/schema",
      );
    });

    it("should update config name", () => {
      const { setConfigName } = useWizardStore.getState();
      setConfigName("my-config");
      expect(useWizardStore.getState().configName).toBe("my-config");
    });

    it("should update JSON content", () => {
      const { setJsonContent } = useWizardStore.getState();
      const content = '{"key": "value"}';
      setJsonContent(content);
      expect(useWizardStore.getState().jsonContent).toBe(content);
    });

    it("should update original JSON content", () => {
      const { setOriginalJsonContent } = useWizardStore.getState();
      const content = '{"original": true}';
      setOriginalJsonContent(content);
      expect(useWizardStore.getState().originalJsonContent).toBe(content);
    });
  });

  describe("Step Validation", () => {
    it("should mark step 1 as valid", () => {
      const { setStepValid, stepValidation } = useWizardStore.getState();
      expect(stepValidation.step1Valid).toBe(false);

      setStepValid(1, true);
      expect(useWizardStore.getState().stepValidation.step1Valid).toBe(true);
    });

    it("should mark step 2 as valid", () => {
      const { setStepValid } = useWizardStore.getState();
      setStepValid(2, true);
      expect(useWizardStore.getState().stepValidation.step2Valid).toBe(true);
    });

    it("should mark step 3 as valid", () => {
      const { setStepValid } = useWizardStore.getState();
      setStepValid(3, true);
      expect(useWizardStore.getState().stepValidation.step3Valid).toBe(true);
    });

    it("should mark step as invalid", () => {
      const { setStepValid } = useWizardStore.getState();
      setStepValid(1, true);
      expect(useWizardStore.getState().stepValidation.step1Valid).toBe(true);

      setStepValid(1, false);
      expect(useWizardStore.getState().stepValidation.step1Valid).toBe(false);
    });
  });

  describe("Mode Changes", () => {
    it("should set mode to EDIT", () => {
      const { setMode } = useWizardStore.getState();
      setMode("edit");
      expect(useWizardStore.getState().mode).toBe("edit");
    });

    it("should set mode to ROLLBACK", () => {
      const { setMode } = useWizardStore.getState();
      setMode("rollback");
      expect(useWizardStore.getState().mode).toBe("rollback");
    });
  });

  describe("Initialization for EDIT Mode", () => {
    it("should initialize state for EDIT mode", () => {
      const { initializeForEdit } = useWizardStore.getState();
      const configName = "test-config";
      const schemaId = "https://example.com/schema";
      const content = '{"test": true}';

      initializeForEdit(configName, schemaId, content);

      const state = useWizardStore.getState();
      expect(state.mode).toBe("edit");
      expect(state.currentStep).toBe(3);
      expect(state.configName).toBe(configName);
      expect(state.schemaId).toBe(schemaId);
      expect(state.jsonContent).toBe(content);
      expect(state.originalJsonContent).toBe(content);
    });
  });

  describe("Initialization for ROLLBACK Mode", () => {
    it("should initialize state for ROLLBACK mode", () => {
      const { initializeForRollback } = useWizardStore.getState();
      const configName = "test-config";
      const schemaId = "https://example.com/schema";
      const content = '{"rollback": true}';
      const rollbackFromVersion = 5;

      initializeForRollback(configName, schemaId, content, rollbackFromVersion);

      const state = useWizardStore.getState();
      expect(state.mode).toBe("rollback");
      expect(state.currentStep).toBe(4);
      expect(state.configName).toBe(configName);
      expect(state.schemaId).toBe(schemaId);
      expect(state.jsonContent).toBe(content);
      expect(state.originalJsonContent).toBe(content);
    });

    it("should allow navigation back from step 4 to step 3 in ROLLBACK mode", () => {
      const { initializeForRollback, prevStep } = useWizardStore.getState();
      
      initializeForRollback("test", "https://schema", "{}", 5);
      expect(useWizardStore.getState().currentStep).toBe(4);
      
      prevStep();
      expect(useWizardStore.getState().currentStep).toBe(3);
    });
  });

  describe("Reset", () => {
    it("should reset state to initial values", () => {
      const {
        setMode,
        setCurrentStep,
        setConfigName,
        setSchemaId,
        setJsonContent,
        setStepValid,
        reset,
      } = useWizardStore.getState();

      // Make changes
      setMode("edit");
      setCurrentStep(3);
      setConfigName("test");
      setSchemaId("test-schema");
      setJsonContent('{"changed": true}');
      setStepValid(1, true);
      setStepValid(2, true);
      setStepValid(3, true);

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
      expect(state.stepValidation.step1Valid).toBe(false);
      expect(state.stepValidation.step2Valid).toBe(false);
      expect(state.stepValidation.step3Valid).toBe(false);
    });
  });
});
