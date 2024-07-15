import { version } from '../api/client';
import { GeneralInfoForm } from '../pages/createConfig/step1GeneralInfo/step1GeneralInfo.schemas';

export enum StepEnum {
  STEP1 = 0, // General Info
  STEP2 = 1, // Config
  STEP3 = 2, // Review & Approve
  FINISH = 3, // Finish
}

type ConfigData = { [key: string]: unknown };

export type ConfigFormMode = 'NEW_CONFIG' | 'NEW_VERSION' | 'ROLLBACK';

export type ConfigFormData = {
  step1: GeneralInfoForm;
  step2: {
    configData: ConfigData;
    configJsonStringData: string;
  };
  step3: {
    mode: ConfigFormMode;
    previousVersion: version;
    nextVersion: version;
    rollBackVersion: version;
  };
};

export type ValidationState = {
  step1: boolean;
  step2: boolean;
  step3: boolean;
};

export type ConfigFormState = {
  formData: ConfigFormData;
  validation: ValidationState;
  currentStep: StepEnum;
  isSubmitting: boolean;
  isSubmittingError: boolean;
  isSubmittingSuccess: boolean;
};

type SetFormDataAction = {
  [K in keyof ConfigFormData]: {
    type: 'SET_FORM_DATA';
    step: K;
    payload: Partial<ConfigFormData[K]>;
  };
}[keyof ConfigFormData];

export type ConfigFormAction =
  | { type: 'SET_STEP'; payload: number }
  | SetFormDataAction
  | { type: 'SET_VALIDATION_RESULT'; step: keyof ValidationState; payload: boolean }
  | { type: 'LOAD_EXISTING_CONFIG'; payload: ConfigFormData; startStep: StepEnum };
