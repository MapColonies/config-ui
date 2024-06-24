import { useQuery } from '@tanstack/react-query';
import { getSchema } from '../../api/client';
import { useSearchParams } from 'react-router-dom';
import { MonacoViewer } from '../../components/MonacoViewer/monacoViewer';
import { Box, Toolbar, Typography } from '@mui/material';
import { QueryDataRenderer } from '../../components/queryDataRenderer/queryDataRenderer';

export const ViewSchemaPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const schemaId = searchParams.get('schemaId');
  console.log(schemaId);
  const { data, isLoading, isSuccess, error } = useQuery({
    queryKey: ['viewConfigGetSchema', schemaId],
    queryFn: () => getSchema({ id: schemaId ?? '', shouldDereference: true }),
  });

  console.log(data);
  return (
    <Box>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography variant="h4">View Schema</Typography>
      </Toolbar>
      <QueryDataRenderer isLoading={isLoading} error={error} isSuccess={isSuccess}>
        <MonacoViewer viewData={data} />
      </QueryDataRenderer>
    </Box>
  );
};
