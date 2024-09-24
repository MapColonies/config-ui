import { Box } from '@mui/material';
import Ajv2019 from 'ajv/dist/2019';
import * as draft7MetaSchema from 'ajv/dist/refs/json-schema-draft-07.json' assert { type: 'json' };
import { config as Config, getSchema } from '../../../api/client';
import Form from '@rjsf/mui';
import { RJSFSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { useQuery } from '@tanstack/react-query';
import Styles from './viewConfig.module.scss';
import { QueryDataRenderer } from '../../../components/queryDataRenderer/queryDataRenderer';

const validator = customizeValidator({ ajvOptionsOverrides: { discriminator: true, keywords: ['x-env-value'] }, AjvClass: Ajv2019 });

validator.ajv.addMetaSchema(draft7MetaSchema);

type ViewConfigPageProps = {
  configInfo: Config;
};

export const ViewConfigPage: React.FC<ViewConfigPageProps> = ({ configInfo }) => {
  const { data, isLoading, isSuccess, error } = useQuery({
    queryKey: ['viewConfigGetSchema', configInfo.schemaId],
    queryFn: () => getSchema({ id: configInfo.schemaId, shouldDereference: true }),
  });

  return (
    <Box>
      <QueryDataRenderer isLoading={isLoading} error={error} isSuccess={isSuccess}>
        <Box sx={{ overflowY: 'auto', height: '100vh', padding: '10px' }}>
          {<Form className={Styles.form} schema={data as RJSFSchema} formData={configInfo.config} validator={validator} readonly={true} />}
        </Box>
      </QueryDataRenderer>
    </Box>
  );
};
