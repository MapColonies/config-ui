import { useParams } from 'react-router-dom';
import { routes } from '../../routing/routes';
import { CustomTabs } from '../../components/Tabs/CustomTabs';
import { ViewConfigPage } from './viewConfig/viewConfig';
import { Box, Typography } from '@mui/material';
import { ConfigInfoPage } from './configInfo/configInfoPage';
import { useQuery } from '@tanstack/react-query';
import { config as Config, getVersionedConfig } from '../../api/client';
import { ViewConfigJsonPage } from './viewConfigJson/viewConfigJson';
import { useCallback, useMemo } from 'react';
import { QueryDataRenderer } from '../../components/queryDataRenderer/queryDataRenderer';

type ConfigPageTabsProps = {
  data: Config;
};

const ConfigPageTabs: React.FC<ConfigPageTabsProps> = ({ data }) => {
  const { version, configName: name } = data;
  const tabs = [
    { label: 'Info', path: encodeURI(`${routes.CONFIG}/${name}/${version}`), component: <ConfigInfoPage configInfo={data} /> },
    {
      label: 'Data',
      path: encodeURI(`${routes.CONFIG}/${name}/${version}/data`),
      component: <ViewConfigPage config={data} />,
    },
    {
      label: 'JSON',
      path: encodeURI(`${routes.CONFIG}/${name}/${version}/json`),
      component: <ViewConfigJsonPage />,
    },
  ];
  return <CustomTabs tabs={tabs} />;
};

export const ConfigPage: React.FC = () => {
  const { name, version } = useParams();
  const versionNumber = useMemo(() => Number(version), [version]);

  const fetchVersionedConfig = useCallback(() => getVersionedConfig({ name: name ?? '', version: versionNumber }), [name, versionNumber]);
  const { data, error, isSuccess, isLoading } = useQuery({
    queryKey: ['versionedConfig'],
    queryFn: fetchVersionedConfig,
  });

  return (
    <Box>
      <QueryDataRenderer isLoading={isLoading} error={error} isSuccess={isSuccess}>
        <Typography variant="h4"> {`${name}-v${version}`}</Typography>
        {data && <ConfigPageTabs data={data} />}
      </QueryDataRenderer>
    </Box>
  );
};
