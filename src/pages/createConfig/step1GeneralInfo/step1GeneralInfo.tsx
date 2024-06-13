import { Box, TextField, Typography } from '@mui/material';
import Styles from './step1GenerateInfo.module.scss';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { SchemaSelect } from '../../../components/SchemaSelect/schemaSelect';
import { GeneralInfoForm, SchemaSelectValue, generalInfoFormSchema } from './step1GeneralInfo.schemas';

type Step1GeneralInfoProps = {
  onDataChange: (data: GeneralInfoForm | undefined, isValid: boolean) => void;
  initialData?: GeneralInfoForm | undefined;
};

export const Step1GeneralInfo: React.FC<Step1GeneralInfoProps> = ({ onDataChange, initialData }) => {
  const { register, formState, watch, setValue, trigger, setFocus } = useForm<GeneralInfoForm>({
    mode: 'all',
    resolver: zodResolver(generalInfoFormSchema),
    defaultValues: initialData ? initialData : undefined,
  });

  const { errors, isValid } = formState;

  const configName = watch('configName');
  const version = watch('version');
  const schemaId = watch('schemaId');
  const description = watch('description');
  const createdBy = watch('createdBy');
  const schemaSelect = watch('schemaSelect');

  useEffect(() => {
    const values = {
      configName,
      version,
      schemaId,
      description,
      createdBy,
      schemaSelect,
    };

    onDataChange(values, isValid);
  }, [isValid, configName, version, schemaId, description, createdBy, schemaSelect, onDataChange]);

  const handleSchemaSelectDataChange = (value: SchemaSelectValue) => {
    setValue('schemaSelect', value);
    setValue('schemaId', value?.schemaSelection?.id ?? '');
    if (value?.schemaSelection?.id) {
      setFocus('schemaId');
      trigger('schemaId');
    }
  };

  return (
    <Box component={'form'}>
      <Typography align="center" variant="h4">
        {'General Info Step 1'}
      </Typography>

      <Box className={Styles.generalInfoForm}>
        <SchemaSelect initialValue={schemaSelect} {...register('schemaSelect')} onChange={handleSchemaSelectDataChange} />
        <TextField
          className="MuiFormLabel-filled"
          id="schemaId"
          label="Schema Id"
          variant="outlined"
          error={!!errors.schemaId}
          helperText={errors.schemaId?.message}
          InputLabelProps={{ shrink: !!schemaId }}
          {...register('schemaId')}
        />
        <TextField
          id="configName"
          label="Config Name"
          variant="outlined"
          error={!!errors.configName}
          helperText={errors.configName?.message}
          {...register('configName')}
        />
        <TextField
          id="version"
          label="Version"
          variant="outlined"
          inputProps={{ type: 'number', min: 1, inputMode: 'numeric' }}
          inputMode="numeric"
          type="number"
          error={!!errors.version}
          helperText={errors.version?.message}
          {...register('version')}
        />

        <TextField
          id="createdBy"
          label="Created By"
          variant="outlined"
          error={!!errors.createdBy}
          helperText={errors.createdBy?.message}
          {...register('createdBy')}
        />
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
