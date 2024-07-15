import { Box, Divider, Toolbar, Typography } from '@mui/material';
import { HorizontalLinearStepper } from '../../components/HorizontalLinearStepper/horizontalLinearStepper';
import Styles from './createConfig.module.scss';
import { Step1GeneralInfo } from './step1GeneralInfo/step1GeneralInfo';
import { Step2AddConfig } from './step2AddConfig/step2AddConfig';
import { Step3ReviewAndApprove } from './step3ReviewAndApprove/step3ReviewAndApprove';
import { useCallback, useEffect, useMemo } from 'react';
import { ConfigModeState } from './createConfig.types';
import { StepSequence } from '../../components/HorizontalLinearStepper/step.types';
import { ApiError, UpsertConfigData, getConfigsByName, getVersionedConfig, upsertConfig, version } from '../../api/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { routes } from '../../routing/routes';
import { useSnackbar } from 'notistack';
import { snackBarErrorOptions, snackBarSuccessOptions } from '../../utils/notistack';
import { PageTitle } from '../../components/pageTitle/pageTitle';
import { useConfigForm } from '../../hooks/useConfigForm';
import { jsonFormatter } from '../../utils/jsonFormatter';
import { ConfigFormData } from '../../types/configForm.types';
import { getStepByMode } from './createConfig.utils';

export const CreateConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { state: configModeState } = useLocation();
  const { versionedConfigData, mode } = (configModeState as ConfigModeState) ?? {};

  const startStep = useMemo(() => {
    return getStepByMode(mode);
  }, [mode]);

  const { state: configFormState, dispatch } = useConfigForm();

  const { data, isSuccess } = useQuery({
    queryKey: [getVersionedConfig.name, versionedConfigData?.name, versionedConfigData?.version],
    queryFn: () => getVersionedConfig(versionedConfigData ?? { name: '', version: 0 }),
    enabled: !!versionedConfigData,
  });

  const { mutateAsync: getConfigByName } = useMutation({
    mutationFn: getConfigsByName,
  });

  useEffect(() => {
    if (mode !== undefined && isSuccess) {
      const configForm: ConfigFormData = {
        step1: {
          configName: data.configName,
          schemaId: data.schemaId,
        },
        step2: {
          configData: data.config,
          configJsonStringData: jsonFormatter(data.config),
        },
        step3: {
          mode: mode,
          nextVersion: (data.version as number) + 1,
          previousVersion: data.version,
          rollBackVersion: data.version,
        },
      };

      dispatch({ type: 'LOAD_EXISTING_CONFIG', startStep: startStep, payload: configForm });
      dispatch({ type: 'SET_VALIDATION_RESULT', step: 'step1', payload: true });
      dispatch({ type: 'SET_VALIDATION_RESULT', step: 'step2', payload: true });
      dispatch({ type: 'SET_VALIDATION_RESULT', step: 'step3', payload: true });
    }
  }, [dispatch, isSuccess, data, mode, startStep]);

  useEffect(() => {
    const configName = configFormState.formData.step1.configName;
    if (!configName) {
      return;
    }

    let version: version = 1;

    getConfigByName({ name: configName })
      .then((config) => {
        version = config.version;
        const nextVersion = (version as number) + 1;
        dispatch({ type: 'SET_FORM_DATA', step: 'step3', payload: { mode: mode ?? 'NEW_VERSION', nextVersion, previousVersion: version } });
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          dispatch({ type: 'SET_FORM_DATA', step: 'step3', payload: { mode: 'NEW_CONFIG', nextVersion: version } });
        }
      });
  }, [getConfigByName, dispatch, configFormState.formData.step1.configName, mode]);

  const { mutateAsync: createConfig } = useMutation({ mutationFn: upsertConfig });

  useEffect(() => {
    if (versionedConfigData) {
      return;
    }
    dispatch({ type: 'SET_FORM_DATA', step: 'step2', payload: { configJsonStringData: '{}' } });
  }, [configFormState.formData.step1.schemaId, versionedConfigData, dispatch]);

  const steps: StepSequence = [
    {
      label: 'General Info',
      isValid: configFormState.validation.step1,
      component: <Step1GeneralInfo />,
    },
    {
      label: 'Add Config',
      isValid: configFormState.validation.step2,
      component: <Step2AddConfig />,
    },
    {
      label: 'Review & Approve',
      isValid: true,
      component: <Step3ReviewAndApprove />,
    },
  ];

  const onStepChange = (step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const handleFinish = useCallback(async (): Promise<boolean> => {
    if (!configFormState.validation.step1 || !configFormState.validation.step2) {
      return false;
    }

    const upsertData: UpsertConfigData = {
      requestBody: {
        configName: configFormState.formData.step1.configName,
        schemaId: configFormState.formData.step1.schemaId,
        version: configFormState.formData.step3.previousVersion,
        config: configFormState.formData.step2.configData,
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
            const message = (e.body as { message?: string | undefined }).message;
            return enqueueSnackbar(message ?? 'Failed To Create Config', snackBarErrorOptions);
          }
          enqueueSnackbar('Failed To Create Config', snackBarErrorOptions);
        },
      });
      return true;
    } catch (e) {
      return false;
    }
  }, [createConfig, navigate, enqueueSnackbar, configFormState.formData, configFormState.validation]);

  return (
    <>
      <PageTitle title={`Step-${configFormState.currentStep + 1} · Create Config`} />

      <Box className={Styles.createConfigContainer}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'start' }}>
          <Typography variant="h5">{steps[configFormState.currentStep].label}</Typography>
        </Toolbar>
        <Divider />
        <Box flexGrow={1}>{steps[configFormState.currentStep].component}</Box>
        <Box>
          <HorizontalLinearStepper
            className={Styles.stepper}
            steps={steps}
            onStepChange={onStepChange}
            startStep={startStep}
            buttons={{ finish: { buttonName: 'Create Config', action: handleFinish } }}
          />
        </Box>
      </Box>
    </>
  );
};
