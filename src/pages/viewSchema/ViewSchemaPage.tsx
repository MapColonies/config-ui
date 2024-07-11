import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Box, Divider, Toolbar, Typography, Switch, FormControlLabel } from '@mui/material';
import { getSchema } from '../../api/client';
import { MonacoViewer } from '../../components/MonacoViewer/monacoViewer';
import { QueryDataRenderer } from '../../components/queryDataRenderer/queryDataRenderer';
import { PageTitle } from '../../components/pageTitle/pageTitle';
import { removeBaseUrlFromSchemaId } from '../../utils/schemaUtils';
import { dereferenceJsonSchema, isSchemaRef } from '../../utils/schemaRefParser';
import { SchemaObject } from 'ajv';
import { jsonFormatter } from '../../utils/jsonFormatter';

export const ViewSchemaPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const schemaId = searchParams.get('schemaId');
  const [isDereferenced, setIsDereferenced] = useState<boolean>(false);
  const schemaName = useMemo(() => removeBaseUrlFromSchemaId(schemaId ?? ''), [schemaId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['getSchema', schemaId, isDereferenced],
    queryFn: async () => {
      const original = await getSchema({ id: schemaId ?? '', shouldDereference: false });
      const disableToggle = !isSchemaRef(jsonFormatter(original));
      if (isDereferenced) {
        const dereferenced = await dereferenceJsonSchema(original as SchemaObject);
        return { originalSchema: original, dereferencedSchema: dereferenced, disableToggle };
      }

      return { originalSchema: original, dereferencedSchema: null, disableToggle };
    },
  });

  const dereferenceToggle = useMemo(() => {
    const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsDereferenced(event.target.checked);
    };

    const disabled = isLoading || data?.disableToggle;

    return (
      <Toolbar>
        <FormControlLabel
          control={<Switch checked={isDereferenced} onChange={handleToggleChange} disabled={disabled} />}
          label={isDereferenced ? 'View Original Schema' : 'View Dereferenced Schema'}
        />
      </Toolbar>
    );
  }, [isDereferenced, isLoading, data?.disableToggle]);

  return (
    <Box>
      <PageTitle title={`${schemaName} · View Schema`} />
      <QueryDataRenderer isLoading={isLoading} error={error} isSuccess={!!data?.originalSchema}>
        <Box>
          <Toolbar sx={{ display: 'flex', justifyContent: 'start' }}>
            <Typography variant="h4">{schemaName}</Typography>
          </Toolbar>
          {dereferenceToggle}
          <Divider />
          <Box sx={{ pt: '2%' }}>{<MonacoViewer viewData={isDereferenced ? data?.dereferencedSchema : data?.originalSchema} height={'85vh'} />}</Box>
        </Box>
      </QueryDataRenderer>
    </Box>
  );
};
