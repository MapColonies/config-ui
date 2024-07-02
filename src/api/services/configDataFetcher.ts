import { getVersionedConfig, GetVersionedConfigData, GetVersionedConfigResponse, version as Version } from '../client';
import { queryClient } from '../tanstack/queryClient';

export async function fetchConfigData(config: GetVersionedConfigData): Promise<GetVersionedConfigResponse | undefined> {
  const queryHash = getVersionedConfigQueryHash(config);
  const cacheConfig = queryClient.getQueryCache().get<GetVersionedConfigResponse>(queryHash)?.state.data;
  const configResponse =
    cacheConfig ??
    (await queryClient.fetchQuery({
      queryKey: [getVersionedConfig.name, config.name, config.version],
      queryFn: () => getVersionedConfig(config),
      queryHash: queryHash,
    }));

  return configResponse;
}

export function getVersionedConfigQueryHash(config: GetVersionedConfigData): string {
  return `${getVersionedConfig.name}_${config.name}_${config.version}`;
}

export function calcConfigVersion(stringVersion: string): Version {
  if (stringVersion === 'latest') {
    return 'latest';
  }
  try {
    return parseInt(stringVersion);
  } catch (e) {
    return 0;
  }
}
