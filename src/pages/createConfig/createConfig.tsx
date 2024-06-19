import { Box, Typography } from '@mui/material';
import { HorizontalLinearStepper } from '../../components/HorizontalLinearStepper/horizontalLinearStepper';
import Styles from './createConfig.module.scss';
import { Step1GeneralInfo } from './step1GeneralInfo/step1GeneralInfo';
import { Step2AddConfig } from './step2AddConfig/step2AddConfig';
import { Step3ReviewAndApprove } from './step3ReviewAndApprove/step3ReviewAndApprove';
import { useCallback, useEffect, useState } from 'react';
import { ConfigData, StepEnum } from './createConfig.types';
import { StepSequence } from '../../components/HorizontalLinearStepper/step.types';
import { ApiError, UpsertConfigData, upsertConfig } from '../../api/client';
import { useMutation } from '@tanstack/react-query';
import { GeneralInfoForm } from './step1GeneralInfo/step1GeneralInfo.schemas';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../routing/routes';
import { useSnackbar } from 'notistack';
import { snackBarErrorOptions, snackBarSuccessOptions } from '../../utils/notistack';

export const CreateConfigsPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [currentStep, setCurrentStep] = useState<StepEnum>(StepEnum.STEP1);
  const [step1GeneralInfoData, setStep1GeneralInfoData] = useState<GeneralInfoForm | undefined>(undefined);
  const [isStep1Valid, setIsStep1Valid] = useState<boolean>(false);
  const [step2AddConfigData, setStep2AddConfigData] = useState<ConfigData>();
  const [step2JsonStringData, setStep2JsonStringData] = useState<string | undefined>(undefined);
  const [isStep2Valid, setIsStep2Valid] = useState<boolean>(false);

  const { mutateAsync: createConfig } = useMutation({ mutationFn: upsertConfig });

  useEffect(() => {
    setStep2JsonStringData(undefined);
  }, [step1GeneralInfoData?.schemaId]);

  const onStep1GeneralInfoDataChange = useCallback((data: GeneralInfoForm | undefined, isValid: boolean) => {
    setStep1GeneralInfoData(data);
    setIsStep1Valid(isValid);
  }, []);

  const onStep2AddConfigDataChange = useCallback((data: ConfigData | undefined, isValid: boolean) => {
    setStep2AddConfigData(data);
    setIsStep2Valid(isValid);
  }, []);

  const steps: StepSequence = [
    {
      label: 'General Info',
      isValid: isStep1Valid,
      component: <Step1GeneralInfo onDataChange={onStep1GeneralInfoDataChange} initialData={step1GeneralInfoData && { ...step1GeneralInfoData }} />,
    },
    {
      label: 'Config',
      isValid: isStep2Valid,
      component: step1GeneralInfoData && (
        <Step2AddConfig
          schemaId={step1GeneralInfoData.schemaId}
          onDataChange={onStep2AddConfigDataChange}
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
    if (!step1GeneralInfoData || !step2AddConfigData) {
      return false;
    }

    const upsertData: UpsertConfigData = {
      requestBody: {
        configName: step1GeneralInfoData.configName,
        schemaId: step1GeneralInfoData.schemaId,
        version: Number(step1GeneralInfoData.version),
        config: step2AddConfigData,
      },
    };

    try {
      await createConfig(upsertData, {
        onSuccess: () => {
          enqueueSnackbar('Config created successfully', snackBarSuccessOptions);
          navigate(`${routes.CONFIG}/${upsertData.requestBody.configName}/latest`);
        },
        onError: (e) => {
          if (e instanceof ApiError) {
            const message = (e.body as { message: string }).message;
            enqueueSnackbar(message ?? 'Failed To Create Config', snackBarErrorOptions);
          }
        },
      });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }, [step1GeneralInfoData, step2AddConfigData, createConfig, navigate, enqueueSnackbar]);

  const handleReset = () => {
    setCurrentStep(StepEnum.STEP1);
    setStep1GeneralInfoData(undefined);
    setIsStep1Valid(false);
    setStep2AddConfigData(undefined);
    setStep2JsonStringData(undefined);
    setIsStep2Valid(false);
  };

  return (
    <Box className={Styles.createConfigContainer}>
      <Typography variant="h3">Create Config</Typography>
      <Box flexGrow={1}>{steps[currentStep].component}</Box>
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
