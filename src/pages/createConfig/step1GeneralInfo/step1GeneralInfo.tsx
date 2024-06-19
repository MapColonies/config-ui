import { Box, TextField, Typography } from '@mui/material';
import Styles from './step1GenerateInfo.module.scss';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { GeneralInfoForm, generalInfoFormSchema } from './step1GeneralInfo.schemas';
import { SchemaSelect } from '../../../components/schemaSelect/schemaSelect';
import { getConfigsByName } from '../../../api/client';
import { useMutation } from '@tanstack/react-query';

const DefaultVersion = '1';

type Step1GeneralInfoProps = {
  onDataChange: (data: GeneralInfoForm | undefined, isValid: boolean) => void;
  initialData?: GeneralInfoForm | undefined;
};

export const Step1GeneralInfo: React.FC<Step1GeneralInfoProps> = ({ onDataChange, initialData }) => {
  const { mutateAsync: getConfigByName } = useMutation({
    mutationFn: getConfigsByName,
  });

  const { register, formState, watch, setValue, trigger } = useForm<GeneralInfoForm>({
    mode: 'all',
    resolver: zodResolver(generalInfoFormSchema),
    defaultValues: { ...initialData, version: initialData?.version ?? DefaultVersion },
  });

  const { errors, isValid } = formState;

  const configName = watch('configName');
  const version = watch('version');
  const schemaId = watch('schemaId');
  const description = watch('description');

  useEffect(() => {
    const values = {
      configName,
      version,
      schemaId,
      description,
    };
    onDataChange(values, isValid);
  }, [isValid, configName, version, schemaId, description, onDataChange]);

  useEffect(() => {
    if (!configName) {
      return;
    }

    let version: string = DefaultVersion;

    getConfigByName({ name: configName })
      .then((config) => {
        version = String(config.version);
      })
      .catch((error) => {
        console.error('Failed to fetch config', error);
      })
      .finally(() => {
        setValue('version', version, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      });
  }, [configName, getConfigByName, setValue]);

  const handleSchemaSelectDataChange = (value: string) => {
    setValue('schemaId', value);
    trigger('schemaId');
  };

  return (
    <Box component={'form'}>
      <Typography align="center" variant="h4">
        {'General Info Step 1'}
      </Typography>

      <Box className={Styles.generalInfoForm}>
        <SchemaSelect error={errors.schemaId?.message} initialValue={initialData?.schemaId} onChange={handleSchemaSelectDataChange} />
        <TextField
          id="configName"
          label="Config Name"
          variant="outlined"
          error={!!errors.configName}
          helperText={errors.configName?.message}
          {...register('configName')}
        />
        {/* // We need to decide how to handle the version field
        <TextField
          hidden={true}
          hiddenLabel={true}
          id="version"
          label="Version"
          variant="outlined"
          inputProps={{ type: 'number', min: 1, inputMode: 'numeric' }}
          inputMode="numeric"
          type="number"
          // InputProps={{ readOnly: true }}
          error={!!errors.version}
          helperText={errors.version?.message}
          {...register('version')}
        /> */}
        <TextField
          id="description"
          label="Description"
          variant="outlined"
          multiline
          minRows={5}
          error={!!errors.description}
          helperText={errors.description?.message}
          {...register('description')}
        />
      </Box>
    </Box>
  );
};
