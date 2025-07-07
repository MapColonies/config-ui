import { useParams } from 'react-router-dom';
import { routes } from '../../routing/routes';
import { CustomTabs } from '../../components/Tabs/CustomTabs';
import { ViewConfigPage } from './viewConfig/viewConfig';
import { Box, Divider, Toolbar, Typography } from '@mui/material';
import { ConfigInfoPage } from './configInfo/configInfoPage';
import { useQuery } from '@tanstack/react-query';
import { config as Config, getVersionedConfig, ParameterVersionQuery as Version } from '../../api/client';
import { useCallback, useMemo } from 'react';
import { QueryDataRenderer } from '../../components/queryDataRenderer/queryDataRenderer';
import { MonacoViewer } from '../../components/MonacoViewer/monacoViewer';
import { PageTitle } from '../../components/pageTitle/pageTitle';

type ConfigPageTabsProps = {
  configInfo: Config;
  processedVersion: Version;
};

const ConfigPageTabs: React.FC<ConfigPageTabsProps> = ({ configInfo, processedVersion }) => {
  const { configName: name } = configInfo;
  const nameAndVersion = `${name}:v${processedVersion}`;
  const encodedSchemaId = encodeURIComponent(configInfo.schemaId);
  const tabs = [
    {
      label: 'Info',
      path: encodeURI(`${routes.CONFIG}/${name}/${processedVersion}/${encodedSchemaId}`),
      component: (
        <>
          <PageTitle title={`${nameAndVersion} · Config Info`} />
          <ConfigInfoPage configInfo={configInfo} />
        </>
      ),
    },
    {
      label: 'Data',
      path: encodeURI(`${routes.CONFIG}/${name}/${processedVersion}/${encodedSchemaId}/data`),
      component: (
        <>
          <PageTitle title={`${nameAndVersion} · Config Data`} />
          <ViewConfigPage configInfo={configInfo} />
        </>
      ),
    },
    {
      label: 'JSON',
      path: encodeURI(`${routes.CONFIG}/${name}/${processedVersion}/${encodedSchemaId}/json`),
      component: (
        <>
          <PageTitle title={`${nameAndVersion} · Config JSON`} />
          <MonacoViewer height={'85vh'} viewData={configInfo.config} />
        </>
      ),
    },
  ];
  return <CustomTabs tabs={tabs} />;
};

export const ConfigPage: React.FC = () => {
  const { name, version, schemaId } = useParams();
  const processedVersion: Version = useMemo(() => (version === 'latest' ? 'latest' : Number(version)), [version]);

  // Decode the schemaId from URL encoding
  const decodedSchemaId = schemaId ? decodeURIComponent(schemaId) : undefined;

  const fetchVersionedConfig = useCallback(() => {
    if (!decodedSchemaId) {
      throw new Error('SchemaId is required but not available');
    }
    return getVersionedConfig({ name: name ?? '', version: processedVersion, schemaId: decodedSchemaId });
  }, [name, processedVersion, decodedSchemaId]);

  const {
    data: configInfo,
    error,
    isSuccess,
    isLoading,
  } = useQuery({
    queryKey: ['versionedConfig', name, processedVersion, decodedSchemaId],
    queryFn: fetchVersionedConfig,
    enabled: !!decodedSchemaId,
  });

  return (
    <Box>
      <QueryDataRenderer isLoading={isLoading} error={error} isSuccess={isSuccess}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'start' }}>
          <Typography variant="h4"> {`${name}:v${configInfo?.version}`}</Typography>
        </Toolbar>
        <Divider />
        {configInfo && <ConfigPageTabs configInfo={configInfo} processedVersion={processedVersion} />}
      </QueryDataRenderer>
    </Box>
  );
};
