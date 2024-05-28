import { createServerApi } from '../api';
import { GetConfigsResponse } from './configTypes';

export const getConfigs = async () => {
  const server = createServerApi();
  const res = await server.get<GetConfigsResponse>('/config');
  return res.data;
};
