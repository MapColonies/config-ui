import { useQuery } from '@tanstack/react-query';
import NestedTable, { NestedData } from './schemaTree/schemaTree';
import { getSchemasTree } from '../../api/client';
import { Box, Divider, Toolbar, Typography } from '@mui/material';
import { PageTitle } from '../../components/pageTitle/pageTitle';

export const SchemasPage: React.FC = () => {
  const { data, isSuccess } = useQuery({ queryKey: ['getSchemasTree'], queryFn: () => getSchemasTree() });

  return (
    <>
      <PageTitle title={'Schemas'} />
      <Toolbar sx={{ display: 'flex', justifyContent: 'start' }}>
        <Typography variant="h4">Schemas</Typography>
      </Toolbar>
      <Divider />

      <Box sx={{ overflowY: 'auto', height: '80vh' }}>
        <NestedTable data={isSuccess ? (data as NestedData[]) : []} />
      </Box>
    </>
  );
};
