import { config as Config, GetVersionedConfigData as VersionedConfigData } from '../../api/client/types.gen';
import { ConfigFormMode } from '../../types/configForm.types';

export enum StepEnum {
  STEP1 = 0, // General Info
  STEP2 = 1, // Config
  STEP3 = 2, // Review & Approve
  FINISH = 3, // Finish
}

export type ConfigInfo = Omit<Config, 'config'>;

export type ConfigData = { [key: string]: unknown };

export type ConfigModeState =
  | {
      versionedConfigData: VersionedConfigData;
      mode: ConfigFormMode;
    }
  | undefined;
