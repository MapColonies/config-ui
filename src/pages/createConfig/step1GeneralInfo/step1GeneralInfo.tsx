import { Box, TextField } from '@mui/material';
import Styles from './step1GenerateInfo.module.scss';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { GeneralInfoForm, generalInfoFormSchema } from './step1GeneralInfo.schemas';
import { SchemaSelect } from '../../../components/schemaSelect/schemaSelect';
import { useConfigForm } from '../../../hooks/useConfigForm';

export const Step1GeneralInfo: React.FC = () => {
  const { state, dispatch } = useConfigForm();
  const { formData, latestConfig } = state;

  const { register, formState, watch, setValue, trigger, setError, clearErrors } = useForm<GeneralInfoForm>({
    mode: 'all',
    resolver: zodResolver(generalInfoFormSchema),
    defaultValues: formData.step1,
  });

  const { errors, isValid } = formState;

  const configName = watch('configName');
  const schemaId = watch('schemaId');
  const description = watch('description');

  useEffect(() => {
    const values = {
      configName,
      schemaId,
      description,
    };
    dispatch({ type: 'SET_FORM_DATA', step: 'step1', payload: values });
    dispatch({ type: 'SET_VALIDATION_RESULT', step: 'step1', payload: isValid });
  }, [isValid, configName, schemaId, description, dispatch]);

  useEffect(() => {
    clearErrors('root');

    if (!latestConfig) {
      return;
    }

    if (latestConfig.schemaId !== schemaId) {
      setError(
        'root',
        { message: `mismatch schema to config name (the matching schema is: "${latestConfig.schemaId}")`, type: 'onChange' },
        { shouldFocus: true }
      );
      return dispatch({ type: 'SET_VALIDATION_RESULT', step: 'step1', payload: false });
    }
  }, [schemaId, latestConfig, setError, clearErrors, configName, dispatch]);

  const handleSchemaSelectDataChange = (value: string) => {
    setValue('schemaId', value);
    trigger('schemaId');
  };

  return (
    <Box component={'form'}>
      <Box className={Styles.generalInfoForm}>
        <SchemaSelect error={errors.root?.message} initialValue={formData.step1.schemaId} onChange={handleSchemaSelectDataChange} />
        <TextField
          id="configName"
          label="Config Name"
          variant="outlined"
          error={!!errors.configName}
          helperText={errors.configName?.message}
          autoComplete="off"
          {...register('configName')}
        />
        <TextField
          id="description"
          label="Description"
          variant="outlined"
          multiline
          minRows={5}
          maxRows={10}
          error={!!errors.description}
          helperText={errors.description?.message}
          {...register('description')}
        />
      </Box>
    </Box>
  );
};
