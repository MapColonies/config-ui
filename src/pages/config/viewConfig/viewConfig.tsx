import { Box, Paper } from '@mui/material';
import { config as Config, getSchema } from '../../../api/client';
import Form from '@rjsf/mui';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { useQuery } from '@tanstack/react-query';
import Styles from './viewConfig.module.scss';
import { QueryDataRenderer } from '../../../components/queryDataRenderer/queryDataRenderer';

type ViewConfigPageProps = {
  config: Config;
};

export const ViewConfigPage: React.FC<ViewConfigPageProps> = ({ config }) => {
  const { data, isLoading, isSuccess, error } = useQuery({
    queryKey: ['getSchema'],
    queryFn: () => getSchema({ id: config.schemaId, shouldDereference: true }),
  });

  return (
    <Box>
      <QueryDataRenderer isLoading={isLoading} error={error} isSuccess={isSuccess}>
        <Paper sx={{ overflowY: 'auto', height: '85vh', padding: '10px' }}>
          {<Form className={Styles.form} schema={data as RJSFSchema} formData={config.config} validator={validator} readonly={true} />}
        </Paper>
      </QueryDataRenderer>
    </Box>
  );
};
