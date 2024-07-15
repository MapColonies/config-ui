import { Box, Card, CardContent, Typography } from '@mui/material';
import { useConfigForm } from '../../../hooks/useConfigForm';
import { MonacoDiffViewer } from '../../../components/monacoDiffViewer/monacoDiffViewer';
import { useMemo } from 'react';
import { MonacoViewer } from '../../../components/MonacoViewer/monacoViewer';

type ModeDetails = {
  header: string;
  message: string;
  originalTitle?: string;
  modifiedTitle?: string;
};

export const Step3ReviewAndApprove: React.FC = () => {
  const { state } = useConfigForm();
  const { nextVersion, mode, rollBackVersion, previousVersion, latestConfigData } = state.formData.step3;
  const { configName } = state.formData.step1;
  const { configJsonStringData: modifiedConfig, configData } = state.formData.step2;

  const originalConfig = useMemo(() => JSON.stringify(latestConfigData, null, 2), [latestConfigData]);

  const getModeDetails = (): ModeDetails => {
    switch (mode) {
      case 'NEW_CONFIG':
        return {
          header: `You are creating a new configuration "${configName}"`,
          message: ``,
        };

      case 'NEW_VERSION':
        return {
          header: `You are adding a new version to the configuration "${configName}"`,
          message: `The new version will be v${nextVersion}`,
          originalTitle: `Original: v${previousVersion}`,
          modifiedTitle: `Modified: v${nextVersion}`,
        };

      case 'ROLLBACK':
        return {
          header: `You are rolling back the configuration "${configName}"`,
          message: `The configuration will be rolled back to v${rollBackVersion}, the new version will be v${nextVersion}`,
          originalTitle: `Original: v${previousVersion}`,
          modifiedTitle: `Modified: v${nextVersion}`,
        };
    }
  };

  const { header, message, originalTitle, modifiedTitle } = getModeDetails();

  const renderEditor = useMemo(() => {
    if (mode === 'NEW_CONFIG') {
      return <MonacoViewer viewData={configData} height={'60vh'} />;
    } else {
      return (
        <MonacoDiffViewer
          height={'55vh'}
          original={originalConfig}
          modified={modifiedConfig}
          originalTitle={originalTitle}
          modifiedTitle={modifiedTitle}
        />
      );
    }
  }, [mode, modifiedConfig, originalConfig, originalTitle, modifiedTitle, configData]);

  return (
    <Box>
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" component="div" gutterBottom>
            {header}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </CardContent>
      </Card>
      <Card sx={{ mt: '10px', p: '10px' }}>{renderEditor}</Card>
    </Box>
  );
};
