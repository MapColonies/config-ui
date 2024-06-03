import { useParams } from 'react-router-dom';
import { routes } from '../../routing/routes';
import { CustomTabs } from '../../components/Tabs/CustomTabs';
import { ViewConfigPage } from './viewConfig/viewConfig';
import { Box, Typography } from '@mui/material';
import { ConfigInfoPage } from './configInfo/configInfoPage';
import { useQuery } from '@tanstack/react-query';
import { getVersionedConfig } from '../../api/client';
import { ViewConfigJsonPage } from './viewConfigJson/viewConfigJson';
import { useCallback, useMemo } from 'react';
import { QueryWrapper } from '../../components/queryWrapper/queryWrapper';

export const ConfigPage: React.FC = () => {
  const { name, version } = useParams();
  const versionNumber = useMemo(() => Number(version), [version]);

  const fetchVersionedConfig = useCallback(() => getVersionedConfig({ name: name ?? '', version: versionNumber }), [name, versionNumber]);
  const { data, error, isSuccess, isLoading } = useQuery({
    queryKey: ['versionedConfig'],
    queryFn: fetchVersionedConfig,
  });

  const tabsMemo = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'Info', path: encodeURI(`${routes.CONFIG}/${name}/${version}`), component: <ConfigInfoPage configInfo={data} /> },
      {
        label: 'Data',
        path: encodeURI(`${routes.CONFIG}/${name}/${version}/data`),
        component: <ViewConfigPage config={data} />,
      },
      {
        label: 'Json',
        path: encodeURI(`${routes.CONFIG}/${name}/${version}/json`),
        component: <ViewConfigJsonPage />,
      },
    ];
  }, [name, version, data]);

  return (
    <Box>
      <QueryWrapper isLoading={isLoading} error={error} isSuccess={isSuccess}>
        <Typography variant="h4"> {`${name}-v${version}`}</Typography>
        <CustomTabs tabs={tabsMemo} />
      </QueryWrapper>
    </Box>
  );
};
