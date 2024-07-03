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
  const tabs = [
    {
      label: 'Info',
      path: encodeURI(`${routes.CONFIG}/${name}/${processedVersion}`),
      component: (
        <>
          <PageTitle title={`${nameAndVersion} · Config Info`} />
          <ConfigInfoPage configInfo={configInfo} />
        </>
      ),
    },
    {
      label: 'Data',
      path: encodeURI(`${routes.CONFIG}/${name}/${processedVersion}/data`),
      component: (
        <>
          <PageTitle title={`${nameAndVersion} · Config Data`} />
          <ViewConfigPage configInfo={configInfo} />
        </>
      ),
    },
    {
      label: 'JSON',
      path: encodeURI(`${routes.CONFIG}/${name}/${processedVersion}/json`),
      component: (
        <>
          <PageTitle title={`${nameAndVersion} · Config JSON`} />
          <MonacoViewer viewData={configInfo.config} />
        </>
      ),
    },
  ];
  return <CustomTabs tabs={tabs} />;
};

export const ConfigPage: React.FC = () => {
  const { name, version } = useParams();
  const processedVersion: Version = useMemo(() => (version === 'latest' ? 'latest' : Number(version)), [version]);

  const fetchVersionedConfig = useCallback(() => getVersionedConfig({ name: name ?? '', version: processedVersion }), [name, processedVersion]);
  const {
    data: configInfo,
    error,
    isSuccess,
    isLoading,
  } = useQuery({
    queryKey: ['versionedConfig'],
    queryFn: fetchVersionedConfig,
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
