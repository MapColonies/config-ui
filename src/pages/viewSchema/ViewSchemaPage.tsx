import React, { useState, useMemo, useEffect } from 'react';
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
  const [currentSchema, setCurrentSchema] = useState<SchemaObject | null>(null);

  const {
    data: originalSchema,
    isLoading: isOriginalLoading,
    error: originalError,
    refetch: refetchOriginal,
  } = useQuery({
    queryKey: ['originalSchema', schemaId],
    queryFn: () => getSchema({ id: schemaId ?? '', shouldDereference: false }),
  });

  const {
    data: dereferencedSchema,
    isLoading: isDereferencedLoading,
    error: dereferencedError,
    refetch: refetchDereferenced,
  } = useQuery({
    queryKey: ['dereferencedSchema', schemaId],
    queryFn: async () => dereferenceJsonSchema(originalSchema as SchemaObject),
    enabled: !!originalSchema && isDereferenced,
  });

  useEffect(() => {
    setCurrentSchema(isDereferenced ? (dereferencedSchema as SchemaObject) : (originalSchema as SchemaObject));
  }, [isDereferenced, dereferencedSchema, originalSchema]);

  const schemaName = useMemo(() => removeBaseUrlFromSchemaId(schemaId ?? ''), [schemaId]);

  const isCurrentSchemaLoading = isDereferenced ? isDereferencedLoading : isOriginalLoading;
  const currentError = isDereferenced ? dereferencedError : originalError;

  const showToggle = useMemo(() => {
    return isSchemaRef(jsonFormatter(originalSchema ?? {}));
  }, [originalSchema]);

  const dereferenceToggle = useMemo(() => {
    const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsDereferenced(event.target.checked);
      if (event.target.checked) {
        refetchDereferenced();
      } else {
        refetchOriginal();
      }
    };

    return (
      <Toolbar>
        <FormControlLabel
          control={<Switch checked={isDereferenced} onChange={handleToggleChange} disabled={isCurrentSchemaLoading || !showToggle} />}
          label={isDereferenced ? 'View Original Schema' : 'View Dereferenced Schema'}
        />
      </Toolbar>
    );
  }, [showToggle, isDereferenced, isCurrentSchemaLoading, refetchDereferenced, refetchOriginal]);

  return (
    <Box>
      <PageTitle title={`${schemaName} · View Schema`} />
      <QueryDataRenderer isLoading={isCurrentSchemaLoading} error={currentError} isSuccess={!!currentSchema}>
        <Box>
          <Toolbar sx={{ display: 'flex', justifyContent: 'start' }}>
            <Typography variant="h4">{schemaName}</Typography>
          </Toolbar>
          {dereferenceToggle}
          <Divider />
          <Box sx={{ pt: '2%' }}>{currentSchema && <MonacoViewer viewData={currentSchema} />}</Box>
        </Box>
      </QueryDataRenderer>
    </Box>
  );
};
