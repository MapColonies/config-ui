import { Box } from '@mui/material';
import { MonacoEditor } from '../../../components/monacoEditor/monacoEditor';
import { jsonFormatter } from './jsonFormatter';

type ViewConfigJsonPageProps = {
  config: unknown;
};

export const ViewConfigJsonPage: React.FC<ViewConfigJsonPageProps> = ({ config }) => {
  const jsonConfig = jsonFormatter(config);

  return (
    <Box>
      <MonacoEditor height={'85vh'} defaultValue={jsonConfig} readonly={true} />
    </Box>
  );
};
