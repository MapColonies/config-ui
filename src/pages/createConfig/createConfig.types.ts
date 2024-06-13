import { config as Config } from '../../api/client/types.gen';

export enum StepEnum {
  STEP1 = 0,
  STEP2 = 1,
  STEP3 = 2,
  FINISH = 3,
}

export type ConfigInfo = Omit<Config, 'config'>;

export type ConfigData = { [key: string]: unknown };
