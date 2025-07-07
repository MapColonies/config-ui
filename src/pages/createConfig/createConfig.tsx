import { Box, Divider, Toolbar, Typography } from '@mui/material';
import { HorizontalLinearStepper } from '../../components/HorizontalLinearStepper/horizontalLinearStepper';
import Styles from './createConfig.module.scss';
import { Step1GeneralInfo } from './step1GeneralInfo/step1GeneralInfo';
import { Step2AddConfig } from './step2AddConfig/step2AddConfig';
import { Step3ReviewAndApprove } from './step3ReviewAndApprove/step3ReviewAndApprove';
import { useCallback, useEffect, useMemo } from 'react';
import { ConfigModeState } from './createConfig.types';
import { StepSequence } from '../../components/HorizontalLinearStepper/step.types';
import { ApiError, UpsertConfigData, getConfigs, getVersionedConfig, upsertConfig, version } from '../../api/client';
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
    queryKey: [getVersionedConfig.name, versionedConfigData?.name, versionedConfigData?.version, versionedConfigData?.schemaId],
    queryFn: () => {
      if (!versionedConfigData?.schemaId) {
        throw new Error('SchemaId is required for getVersionedConfig');
      }
      return getVersionedConfig(versionedConfigData);
    },
    enabled: !!versionedConfigData && !!versionedConfigData.schemaId,
  });

  const { mutateAsync: getConfigByNameAndSchema } = useMutation({
    mutationFn: ({ name, schemaId }: { name: string; schemaId: string }) => getConfigs({ configName: name, schemaId: schemaId, limit: 1 }),
  });

  const { mutateAsync: getAllConfigsByName } = useMutation({
    mutationFn: (name: string) => getConfigs({ configName: name }),
  });

  useEffect(() => {
    if (mode !== undefined && isSuccess) {
      const configForm: ConfigFormData = {
        step1: {
          configName: data.configName,
          schemaId: data.schemaId,
        },
        step2: {
          configData: data.config as { [key: string]: unknown },
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
    const schemaId = configFormState.formData.step1.schemaId;

    if (!configName || !schemaId) {
      return;
    }

    let version: version = 1;

    // First check if there's a config with the same name and schema
    getConfigByNameAndSchema({ name: configName, schemaId })
      .then((response) => {
        const config = response.configs?.[0];
        if (config) {
          // Config exists with same name and schema - this will be a new version
          version = config.version;
          const nextVersion = (version as number) + 1;
          dispatch({
            type: 'SET_FORM_DATA',
            step: 'step3',
            payload: { mode: mode ?? 'NEW_VERSION', nextVersion, previousVersion: version },
          });
          dispatch({ type: 'SET_LATEST_CONFIG', payload: config });
        } else {
          // No config with same name and schema, but need to check if name exists with different schemas
          getAllConfigsByName(configName)
            .then((allConfigsResponse) => {
              const existingConfigs = allConfigsResponse.configs ?? [];
              if (existingConfigs.length > 0) {
                // Check if any existing config has a completely different schema (not just different version)
                const hasConflictingSchema = existingConfigs.some((existingConfig) => {
                  const baseSchemaUrl = schemaId.split('/').slice(0, -1).join('/'); // Remove version part
                  const existingBaseSchemaUrl = existingConfig.schemaId.split('/').slice(0, -1).join('/');
                  return baseSchemaUrl !== existingBaseSchemaUrl;
                });

                if (hasConflictingSchema) {
                  // This means there's a config with same name but completely different schema
                  const conflictingConfig = existingConfigs.find((existingConfig) => {
                    const baseSchemaUrl = schemaId.split('/').slice(0, -1).join('/');
                    const existingBaseSchemaUrl = existingConfig.schemaId.split('/').slice(0, -1).join('/');
                    return baseSchemaUrl !== existingBaseSchemaUrl;
                  });
                  dispatch({ type: 'SET_LATEST_CONFIG', payload: conflictingConfig });
                } else {
                  // Same base schema, different version - this is allowed
                  dispatch({ type: 'SET_FORM_DATA', step: 'step3', payload: { mode: 'NEW_CONFIG', nextVersion: version } });
                  dispatch({ type: 'SET_LATEST_CONFIG', payload: undefined });
                }
              } else {
                // No existing configs with this name
                dispatch({ type: 'SET_FORM_DATA', step: 'step3', payload: { mode: 'NEW_CONFIG', nextVersion: version } });
                dispatch({ type: 'SET_LATEST_CONFIG', payload: undefined });
              }
            })
            .catch((error) => {
              if (error instanceof ApiError && error.status === 404) {
                dispatch({ type: 'SET_FORM_DATA', step: 'step3', payload: { mode: 'NEW_CONFIG', nextVersion: version } });
                dispatch({ type: 'SET_LATEST_CONFIG', payload: undefined });
              }
            });
        }
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          // No config with same name and schema, check for configs with same name but different schemas
          getAllConfigsByName(configName)
            .then((allConfigsResponse) => {
              const existingConfigs = allConfigsResponse.configs ?? [];
              if (existingConfigs.length > 0) {
                // Check if any existing config has a completely different schema
                const hasConflictingSchema = existingConfigs.some((existingConfig) => {
                  const baseSchemaUrl = schemaId.split('/').slice(0, -1).join('/');
                  const existingBaseSchemaUrl = existingConfig.schemaId.split('/').slice(0, -1).join('/');
                  return baseSchemaUrl !== existingBaseSchemaUrl;
                });

                if (hasConflictingSchema) {
                  const conflictingConfig = existingConfigs.find((existingConfig) => {
                    const baseSchemaUrl = schemaId.split('/').slice(0, -1).join('/');
                    const existingBaseSchemaUrl = existingConfig.schemaId.split('/').slice(0, -1).join('/');
                    return baseSchemaUrl !== existingBaseSchemaUrl;
                  });
                  dispatch({ type: 'SET_LATEST_CONFIG', payload: conflictingConfig });
                } else {
                  dispatch({ type: 'SET_FORM_DATA', step: 'step3', payload: { mode: 'NEW_CONFIG', nextVersion: version } });
                  dispatch({ type: 'SET_LATEST_CONFIG', payload: undefined });
                }
              } else {
                dispatch({ type: 'SET_FORM_DATA', step: 'step3', payload: { mode: 'NEW_CONFIG', nextVersion: version } });
                dispatch({ type: 'SET_LATEST_CONFIG', payload: undefined });
              }
            })
            .catch(() => {
              dispatch({ type: 'SET_FORM_DATA', step: 'step3', payload: { mode: 'NEW_CONFIG', nextVersion: version } });
              dispatch({ type: 'SET_LATEST_CONFIG', payload: undefined });
            });
        }
      });
  }, [
    getConfigByNameAndSchema,
    getAllConfigsByName,
    dispatch,
    configFormState.formData.step1.configName,
    configFormState.formData.step1.schemaId,
    mode,
  ]);

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
      } as any, // Type assertion needed because UpsertConfigData expects full config type
    };

    try {
      await createConfig(upsertData, {
        onSuccess: () => {
          enqueueSnackbar('Config created successfully', snackBarSuccessOptions);
          const encodedSchemaId = encodeURIComponent(upsertData.requestBody.schemaId);
          navigate(`${routes.CONFIG}/${upsertData.requestBody.configName}/latest/${encodedSchemaId}`);
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
