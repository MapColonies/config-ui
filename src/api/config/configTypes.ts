export type Config = {
  configName: string;
  schemaId: string;
  version: number;
  createdAt: string;
  createdBy: string;
  config?: unknown;
};

export type GetConfigsResponse = {
  configs: Config[];
  total: number;
};
