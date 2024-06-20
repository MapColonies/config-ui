import { useParams } from 'react-router-dom';
import { routes } from '../../routing/routes';
import { CustomTabs } from '../../components/Tabs/CustomTabs';
import { ViewConfigPage } from './viewConfig/viewConfig';
import { Box, Typography } from '@mui/material';
import { ConfigInfoPage } from './configInfo/configInfoPage';
import { useQuery } from '@tanstack/react-query';
import { config as Config, getVersionedConfig, ParameterVersionQuery as Version } from '../../api/client';
import { ViewConfigJsonPage } from './viewConfigJson/viewConfigJson';
import { useCallback, useMemo } from 'react';
import { QueryDataRenderer } from '../../components/queryDataRenderer/queryDataRenderer';

type ConfigPageTabsProps = {
  configInfo: Config;
  processedVersion: Version;
};

const ConfigPageTabs: React.FC<ConfigPageTabsProps> = ({ configInfo, processedVersion }) => {
  const { configName: name } = configInfo;
  const tabs = [
    { label: 'Info', path: encodeURI(`${routes.CONFIG}/${name}/${processedVersion}`), component: <ConfigInfoPage configInfo={configInfo} /> },
    {
      label: 'Data',
      path: encodeURI(`${routes.CONFIG}/${name}/${processedVersion}/data`),
      component: <ViewConfigPage configInfo={configInfo} />,
    },
    {
      label: 'JSON',
      path: encodeURI(`${routes.CONFIG}/${name}/${processedVersion}/json`),
      component: <ViewConfigJsonPage config={configInfo.config} />,
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
        <Typography variant="h4"> {`${name}-v${configInfo?.version}`}</Typography>
        {configInfo && <ConfigPageTabs configInfo={configInfo} processedVersion={processedVersion} />}
      </QueryDataRenderer>
    </Box>
  );
};
