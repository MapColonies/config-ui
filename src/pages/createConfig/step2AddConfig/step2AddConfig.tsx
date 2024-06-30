import { Box, Card, LinearProgress, Typography } from '@mui/material';
import { languages } from 'monaco-editor';
import ajv from 'ajv';
import { useQuery } from '@tanstack/react-query';
import { ApiError, getSchema } from '../../../api/client';
import { MonacoEditor } from '../../../components/monacoEditor/monacoEditor';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMonaco } from '@monaco-editor/react';
import { ConfigData } from '../createConfig.types';
import { registerRefSnippet } from '../../../utils/monaco/register/registerRefSnippet';
import { dereference, isRef } from '../../../utils/monaco/refHandler';
import { ErrorCard } from '../../../components/errorCard/errorCard';
import { registerRefHoverProvider } from '../../../utils/monaco/register/registerRefHoverProvider';

const ajvInstance = new ajv();

type Step2AddConfigProps = {
  schemaId: string;
  onDataChange: (data: ConfigData | undefined, isValid: boolean) => void;
  onJsonStringChange: (json: string | undefined) => void;
  initialJsonStringData?: string | undefined;
};
export const Step2AddConfig: React.FC<Step2AddConfigProps> = ({ onDataChange, onJsonStringChange, schemaId, initialJsonStringData }) => {
  const monaco = useMonaco();

  const fetchSchemaDereference = useCallback(() => getSchema({ id: schemaId, shouldDereference: true }), [schemaId]);
  const { data: schema, isSuccess } = useQuery({
    queryKey: ['getSchemaWitheRefs'],
    queryFn: fetchSchemaDereference,
    enabled: !!schemaId,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [initProgressBar, setInitProgressBar] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  const [jsonParseError, setJsonParseError] = useState<string | undefined>(undefined);
  const [networkError, setNetworkError] = useState<string | undefined>(undefined);

  const validateJson = useMemo(() => {
    const validate = ajvInstance.compile(schema ?? {});
    return async (data: unknown) => {
      const isValid = validate(data);
      if (!isValid) {
        setValidationError(validate.errors?.[0].message ?? 'Unknown error');
      } else {
        setValidationError(undefined);
      }
      return isValid;
    };
  }, [schema]);

  const diagnosticOptions: languages.json.DiagnosticsOptions = useMemo(() => {
    if (!isSuccess) {
      return {};
    }

    const options: languages.json.DiagnosticsOptions = {
      validate: true,
      schemas: [
        {
          uri: schemaId,
          schema: schema as languages.json.JSONSchema,
          fileMatch: ['*'],
        },
      ],
    };
    return options;
  }, [schema, isSuccess, schemaId]);

  useEffect(() => {
    if (!monaco) {
      return;
    }
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions(diagnosticOptions);
    const snippetProvider = registerRefSnippet(monaco);
    const hoverProvider = registerRefHoverProvider(monaco);

    return () => {
      snippetProvider.dispose();
      hoverProvider.dispose();
    };
  }, [diagnosticOptions, monaco]);

  const handleChange = async (value: string | undefined) => {
    let jsonDereferenced = value ?? '{}';
    onJsonStringChange(value);

    try {
      if (value !== undefined && isRef(value)) {
        setIsLoading(true);

        jsonDereferenced = await dereference(value);
        setNetworkError(undefined);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setNetworkError(error.message);
      } else {
        setNetworkError(undefined);
      }
    } finally {
      setIsLoading(false);
    }

    try {
      setJsonParseError(undefined);
      const json = JSON.parse(jsonDereferenced);
      const isValid = await validateJson(json);
      onDataChange(json, isValid);
    } catch (error) {
      let errMessage = 'Error parsing JSON';
      if (error instanceof Error) {
        errMessage = error.message;
      }
      if (error instanceof SyntaxError) {
        errMessage = error.message;
      }
      setJsonParseError(errMessage);
      onDataChange(undefined, false);
    }
  };

  return (
    <Box key={schemaId}>
      <Typography align="center" variant="h5">
        {'Add Config Step 2'}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {initProgressBar && <LinearProgress value={100} variant={isLoading ? 'indeterminate' : 'determinate'} />}
          <MonacoEditor
            beforeMount={() => setInitProgressBar(true)}
            defaultValue={initialJsonStringData ?? '{}'}
            onChange={handleChange}
            height={'70vh'}
            width={'150vh'}
          />
        </Box>

        <Card sx={{ width: '100%' }}>
          <ErrorCard title={'Network Error'} errorMessage={networkError} />
          <ErrorCard title={'Validation Error'} errorMessage={validationError} />
          <ErrorCard title={'Parsing Error'} errorMessage={jsonParseError} />
        </Card>
      </Box>
    </Box>
  );
};
