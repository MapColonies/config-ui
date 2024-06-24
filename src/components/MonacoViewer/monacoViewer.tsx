import { Box } from '@mui/material';
import { MonacoEditor } from '../monacoEditor/monacoEditor';
import { jsonFormatter } from '../../utils/jsonFormatter';

type MonacoViewerProps = {
  viewData: unknown;
  loading?: boolean;
};

export const MonacoViewer: React.FC<MonacoViewerProps> = ({ viewData, loading }) => {
  const jsonString = jsonFormatter(viewData);

  return (
    <Box>
      <MonacoEditor loading={loading} height={'85vh'} defaultValue={jsonString} readonly={true} />
    </Box>
  );
};
