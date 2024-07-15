import { ConfigFormMode, StepEnum } from '../../types/configForm.types';

export const getStepByMode = (mode: ConfigFormMode | undefined): StepEnum => {
  switch (mode) {
    case 'NEW_CONFIG':
      return StepEnum.STEP1;
    case 'NEW_VERSION':
      return StepEnum.STEP2;
    case 'ROLLBACK':
      return StepEnum.STEP3;
    default:
      return StepEnum.STEP1;
  }
};
