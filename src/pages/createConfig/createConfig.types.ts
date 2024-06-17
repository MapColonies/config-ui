import { config as Config } from '../../api/client/types.gen';

export enum StepEnum {
  STEP1 = 0, // General Info
  STEP2 = 1, // Config
  STEP3 = 2, // Review & Approve
  FINISH = 3, // Finish
}

export type ConfigInfo = Omit<Config, 'config'>;

export type ConfigData = { [key: string]: unknown };
