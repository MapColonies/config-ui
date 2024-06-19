import { Box, Typography } from '@mui/material';
import { languages } from 'monaco-editor';
import ajv from 'ajv';
import { useQuery } from '@tanstack/react-query';
import { getSchema } from '../../../api/client';
import { MonacoEditor } from '../../../components/monacoEditor/monacoEditor';
import { useCallback, useEffect, useMemo } from 'react';
import { useMonaco } from '@monaco-editor/react';
import { ConfigData } from '../createConfig.types';
import { registerRefSnippet } from '../../../utils/monaco/snippetsRegistration/registerRefSnippet';

const ajvInstance = new ajv();

type Step2AddConfigProps = {
  schemaId: string;
  onDataChange: (data: ConfigData | undefined, isValid: boolean) => void;
  onJsonStringChange: (json: string | undefined) => void;
  initialJsonStringData?: string | undefined;
};

export const Step2AddConfig: React.FC<Step2AddConfigProps> = ({ onDataChange, onJsonStringChange, schemaId, initialJsonStringData }) => {
  // const fetchSchema = useCallback(() => getSchema({ id: schemaId, shouldDereference: false }), [schemaId]);
  const fetchSchemaDereference = useCallback(() => getSchema({ id: schemaId, shouldDereference: true }), [schemaId]);

  // const schemaWithRefsRes = useQuery({
  //   queryKey: ['getSchema'],
  //   queryFn: fetchSchema,
  //   enabled: !!schemaId,
  // });

  const { data: schema, isSuccess } = useQuery({
    queryKey: ['getSchemaWitheRefs'],
    queryFn: fetchSchemaDereference,
    enabled: !!schemaId,
  });

  const monaco = useMonaco();

  const validate = useMemo(() => {
    return ajvInstance.compile(schema ?? {});
  }, [schema]);

  const diagnosticOptions: languages.json.DiagnosticsOptions = useMemo(() => {
    if (!isSuccess) {
      return {};
    }

    return {
      validate: true,
      schemas: [
        {
          uri: schemaId,
          schema: schema as languages.json.JSONSchema,
          fileMatch: ['*'],
        },
      ],
    };
  }, [schema, isSuccess, schemaId]);

  useEffect(() => {
    const shouldRegister = monaco?.languages.json.jsonDefaults.diagnosticsOptions.schemas?.length === 0;
    if (shouldRegister) {
      registerRefSnippet(monaco);
    }
  }, [diagnosticOptions, monaco]);

  useEffect(() => {
    if (!monaco) {
      return;
    }
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions(diagnosticOptions);
  }, [diagnosticOptions, monaco]);

  const handleChange = async (value: string | undefined) => {
    try {
      onJsonStringChange(value);
      const json = JSON.parse(value ?? '');
      const isValid = await validate(json);

      onDataChange(json, isValid);
    } catch (e) {
      onDataChange(undefined, false);
    }
  };

  return (
    <Box key={schemaId}>
      <Typography align="center" variant="h4">
        {'Add Config Step 2'}
      </Typography>
      <MonacoEditor value={initialJsonStringData} onChange={handleChange} height={'70vh'} />
    </Box>
  );
};
