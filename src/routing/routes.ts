export const routes = {
  HOME: '/',
  NOT_FOUND: '/404',
  CONFIG: '/config',
  CREATE_CONFIG: '/config/create',
  CONFIG_INFO: '/config/:name/:version',
  VIEW_CONFIG: '/config/:name/:version/data',
  VIEW_CONFIG_JSON: '/config/:name/:version/json',
  SCHEMA: '/schema',
  CREATE_SCHEMA: '/schema/create',
  VIEW_SCHEMA: '/schema/view',
} as const satisfies { [key: string]: string };
