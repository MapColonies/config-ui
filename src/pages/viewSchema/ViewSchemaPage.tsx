import { useQuery } from '@tanstack/react-query';
import { getSchema } from '../../api/client';
import { useSearchParams } from 'react-router-dom';
import { MonacoViewer } from '../../components/MonacoViewer/monacoViewer';
import { Box, Divider, Toolbar, Typography } from '@mui/material';
import { QueryDataRenderer } from '../../components/queryDataRenderer/queryDataRenderer';
import { PageTitle } from '../../components/pageTitle/pageTitle';
import { removeBaseUrlFromSchemaId } from '../../utils/schemaUtils';
import { useMemo } from 'react';

export const ViewSchemaPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const schemaId = searchParams.get('schemaId');
  const { data, isLoading, isSuccess, error } = useQuery({
    queryKey: ['viewConfigGetSchema', schemaId],
    queryFn: () => getSchema({ id: schemaId ?? '', shouldDereference: true }),
  });
  const schemaName = useMemo(() => removeBaseUrlFromSchemaId(schemaId ?? ''), [schemaId]);

  return (
    <>
      <PageTitle title={`${schemaName} · View Schema`} />
      <Box>
        {/* <Typography variant="h4">View Schema</Typography> */}
        <Toolbar sx={{ display: 'flex', justifyContent: 'start' }}>
          <Typography variant="h4">{schemaName}</Typography>
        </Toolbar>
        <Divider />
        <QueryDataRenderer isLoading={isLoading} error={error} isSuccess={isSuccess}>
          <Box sx={{ pt: '2%' }}>
            <MonacoViewer viewData={data} />
          </Box>
        </QueryDataRenderer>
      </Box>
    </>
  );
};
