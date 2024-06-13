import { Box, Typography } from '@mui/material';
import { HorizontalLinearStepper } from '../../components/HorizontalLinearStepper/horizontalLinearStepper';
import Styles from './createConfig.module.scss';
import { Step1GeneralInfo } from './step1GeneralInfo/step1GeneralInfo';
import { Step2AddConfig } from './step2AddConfig/step2AddConfig';
import { Step3ReviewAndApprove } from './step3ReviewAndApprove/step3ReviewAndApprove';
import { useCallback, useEffect, useState } from 'react';
import { ConfigData, StepEnum } from './createConfig.types';
import { StepSequence } from '../../components/HorizontalLinearStepper/step.types';
import { UpsertConfigData, upsertConfig } from '../../api/client';
import { useMutation } from '@tanstack/react-query';
import { GeneralInfoForm } from './step1GeneralInfo/step1GeneralInfo.schemas';

export const CreateConfigsPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<StepEnum>(StepEnum.STEP1);
  const [step1Data, setStep1Data] = useState<GeneralInfoForm | undefined>(undefined);
  const [isStep1Valid, setIsStep1Valid] = useState<boolean>(false);
  const [step2Data, setStep2Data] = useState<ConfigData>();
  const [step2JsonStringData, setStep2JsonStringData] = useState<string | undefined>(undefined);
  const [isStep2Valid, setIsStep2Valid] = useState<boolean>(false);

  const { mutateAsync: createConfig, isSuccess, isError, error } = useMutation({ mutationFn: upsertConfig });

  useEffect(() => {
    console.log('step1Data', step1Data);
    setStep2JsonStringData(undefined);
  }, [step1Data?.schemaId]);

  const onStep1DataChange = useCallback((data: GeneralInfoForm | undefined, isValid: boolean) => {
    setStep1Data(data);
    setIsStep1Valid(isValid);
  }, []);

  const onStep2DataChange = useCallback((data: ConfigData | undefined, isValid: boolean) => {
    setStep2Data(data);
    setIsStep2Valid(isValid);
  }, []);

  const steps: StepSequence = [
    {
      label: 'General Info',
      isValid: isStep1Valid,
      component: <Step1GeneralInfo onDataChange={onStep1DataChange} initialData={step1Data} />,
    },
    {
      label: 'Config',
      isValid: isStep2Valid,
      component: step1Data && (
        <Step2AddConfig
          schemaId={step1Data.schemaId}
          onDataChange={onStep2DataChange}
          initialJsonStringData={step2JsonStringData}
          onJsonStringChange={setStep2JsonStringData}
        />
      ),
    },
    {
      label: 'Review & Approve',
      isValid: true,
      component: <Step3ReviewAndApprove />,
    },
  ];

  const onStepChange = (step: number) => {
    const lastStep = steps.length - 1;

    if (step > lastStep) {
      return;
    }

    setCurrentStep(step);
  };

  const handleFinish = useCallback(async (): Promise<boolean> => {
    if (!step1Data || !step2Data) {
      return false;
    }

    const requestBody: UpsertConfigData = {
      requestBody: {
        configName: step1Data.configName,
        schemaId: step1Data.schemaId,
        version: Number(step1Data.version),
        config: step2Data,
      },
    };

    try {
      await createConfig(requestBody);
      return isSuccess;
    } catch (e) {
      console.log(e);
      return false;
    }
  }, [step1Data, step2Data, createConfig, isSuccess]);

  const handleReset = () => {
    setCurrentStep(StepEnum.STEP1);
    setStep1Data(undefined);
    setIsStep1Valid(false);
    setStep2Data(undefined);
    setStep2JsonStringData(undefined);
    setIsStep2Valid(false);
  };

  return (
    <Box className={Styles.createConfigContainer}>
      <Typography variant="h3">Create Config</Typography>
      <Box flexGrow={1}>{steps[currentStep].component}</Box>
      {isError && <Box sx={{ color: 'red' }}>{error.message}</Box>}
      <Box>
        <HorizontalLinearStepper
          className={Styles.stepper}
          steps={steps}
          onStepChange={onStepChange}
          buttons={{ finish: { buttonName: 'Create Config', action: handleFinish }, reset: { action: handleReset } }}
        />
      </Box>
    </Box>
  );
};
