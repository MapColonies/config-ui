import { createContext, useReducer } from 'react';
import { StepEnum } from '../pages/createConfig/createConfig.types';
import { ConfigFormAction, ConfigFormState } from '../types/configForm.types';

const initialState: ConfigFormState = {
  currentStep: StepEnum.STEP1,
  formData: {
    step1: {
      schemaId: '',
      configName: '',
      description: '',
    },
    step2: {
      configData: {},
      configJsonStringData: '{}',
    },
    step3: {
      mode: 'NEW_CONFIG',
      previousVersion: 1,
      nextVersion: 1,
      rollBackVersion: 1,
      latestConfigData: {},
    },
  },
  validation: {
    step1: false,
    step2: false,
    step3: false,
  },
  isSubmitting: false,
  isSubmittingError: false,
  isSubmittingSuccess: false,
};

const configReducer = (state: ConfigFormState, action: ConfigFormAction): ConfigFormState => {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.step]: {
            ...state.formData[action.step],
            ...action.payload,
          },
        },
      };
    case 'SET_VALIDATION_RESULT':
      return {
        ...state,
        validation: {
          ...state.validation,
          [action.step]: action.payload,
        },
      };
    case 'LOAD_EXISTING_CONFIG':
      return {
        ...state,
        formData: action.payload,
        currentStep: action.startStep,
      };
    default:
      return state;
  }
};

export const ConfigFormContext = createContext<{ state: ConfigFormState; dispatch: React.Dispatch<ConfigFormAction> } | undefined>(undefined);

export const ConfigFormProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(configReducer, initialState);

  return <ConfigFormContext.Provider value={{ state, dispatch }}>{children}</ConfigFormContext.Provider>;
};
