import { Box, Card } from '@mui/material';
import ajv from 'ajv';
import { useQuery } from '@tanstack/react-query';
import { ApiError, getSchema } from '../../../api/client';
import { MonacoEditor } from '../../../components/monacoEditor/monacoEditor';
import { useCallback, useMemo, useState } from 'react';
import { ConfigData } from '../createConfig.types';
import { dereferenceConfig, isRef } from '../../../utils/monaco/refHandler';
import { ErrorCard, ErrorCardProps } from '../../../components/errorCard/errorCard';
import { ErrorType } from '../../../components/errorCard/error.types';

const ajvInstance = new ajv({ keywords: ['x-env-value'], discriminator: true });

type Step2AddConfigProps = {
  schemaId: string;
  onDataChange: (data: ConfigData | undefined, isValid: boolean) => void;
  onJsonStringChange: (json: string | undefined) => void;
  initialJsonStringData?: string | undefined;
};
export const Step2AddConfig: React.FC<Step2AddConfigProps> = ({ onDataChange, onJsonStringChange, schemaId, initialJsonStringData }) => {
  const fetchSchemaDereference = useCallback(() => getSchema({ id: schemaId, shouldDereference: true }), [schemaId]);
  const { data: schema } = useQuery({
    queryKey: ['getSchemaWitheRefs'],
    queryFn: fetchSchemaDereference,
    enabled: !!schemaId,
  });

  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [errors, setErrors] = useState<ErrorCardProps[]>([]);

  const validateJson = useMemo(() => {
    const validate = ajvInstance.compile(schema ?? {});
    return async (data: unknown) => {
      const isValid = validate(data);
      return { isValid, errorMessage: validate.errors?.[0].message };
    };
  }, [schema]);

  const handleEditorChange = async (value: string | undefined) => {
    const newErrors: ErrorCardProps[] = [];
    let jsonDereferenced = value ?? '';
    onJsonStringChange(value);

    try {
      if (value !== undefined && isRef(value)) {
        setIsFetching(true);
        jsonDereferenced = await dereferenceConfig(value);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          newErrors.push({ title: ErrorType.VALIDATION_ERROR, errorMessage: 'Config not found' });
        } else {
          newErrors.push({ title: ErrorType.NETWORK_ERROR, errorMessage: error.message });
          setErrors(newErrors);
          onDataChange(undefined, false);
          return;
        }
      }
    } finally {
      setIsFetching(false);
    }

    try {
      const json = JSON.parse(jsonDereferenced);
      const { isValid, errorMessage } = await validateJson(json);
      onDataChange(json, isValid);
      if (!isValid) {
        newErrors.push({ title: ErrorType.VALIDATION_ERROR, errorMessage: errorMessage });
      }
    } catch (error) {
      let errMessage = 'Error parsing JSON';
      if (error instanceof Error) {
        errMessage = error.message;
      }
      newErrors.push({ title: ErrorType.JSON_PARSE_ERROR, errorMessage: errMessage });
      onDataChange(undefined, false);
    }
    setErrors(newErrors);
  };

  return (
    <Box sx={{ display: 'flex', pt: '1%', flexDirection: { xs: 'column', md: 'row' }, gap: 1 }}>
      <MonacoEditor
        defaultValue={initialJsonStringData ?? '{}'}
        schema={schema}
        onChange={handleEditorChange}
        height={'70vh'}
        isFetching={isFetching}
      />

      <Card sx={{ width: { xs: '100%', md: '300px' } }}>
        {errors.map((error, index) => (
          <ErrorCard key={index} title={error.title} errorMessage={error.errorMessage} />
        ))}
      </Card>
    </Box>
  );
};
