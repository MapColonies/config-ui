import { NestedData } from './schemaTree';

export const complexNestedData: NestedData[] = [
  {
    name: 'Common',
    children: [
      {
        name: 'Authentication',
        children: [
          {
            name: 'OAuth',
            children: [
              { name: 'v1.schema.json', id: 'https://example.com/core/authentication/oauth/v1' },
              { name: 'v2.schema.json', id: 'https://example.com/core/authentication/oauth/v2' },
            ],
          },
          {
            name: 'JWT',
            children: [{ name: 'v1.schema.json', id: 'https://example.com/core/authentication/jwt/v1' }],
          },
        ],
      },
      {
        name: 'Database',
        children: [
          {
            name: 'SQL',
            children: [{ name: 'v1.schema.json', id: 'https://example.com/core/database/sql/v1' }],
          },
          {
            name: 'NoSQL',
            children: [
              { name: 'MongoDB', id: 'https://example.com/core/database/nosql/mongodb' },
              { name: 'CouchDB', id: 'https://example.com/core/database/nosql/couchdb' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Raster',
    children: [
      {
        name: 'Logging',
        children: [
          { name: 'v1.schema.json', id: 'https://example.com/utility/logging/v1' },
          { name: 'v2.schema.json', id: 'https://example.com/utility/logging/v2' },
        ],
      },
      {
        name: 'Monitoring',
        children: [{ name: 'v1.schema.json', id: 'https://example.com/utility/monitoring/v1' }],
      },
    ],
  },
  {
    name: 'Vector',
    children: [
      {
        name: 'Logging',
        children: [
          { name: 'v1.schema.json', id: 'https://example.com/utility/logging/v1' },
          { name: 'v2.schema.json', id: 'https://example.com/utility/logging/v2' },
        ],
      },
      {
        name: 'Monitoring',
        children: [{ name: 'v1.schema.json', id: 'https://example.com/utility/monitoring/v1' }],
      },
    ],
  },
  {
    name: '3D',
    children: [
      {
        name: 'Logging',
        children: [
          { name: 'v1.schema.json', id: 'https://example.com/utility/logging/v1' },
          { name: 'v2.schema.json', id: 'https://example.com/utility/logging/v2' },
        ],
      },
      {
        name: 'Monitoring',
        children: [{ name: 'v1.schema.json', id: 'https://example.com/utility/monitoring/v1' }],
      },
    ],
  },
  {
    name: 'Application',
    children: [
      {
        name: 'Logging',
        children: [
          { name: 'v1.schema.json', id: 'https://example.com/utility/logging/v1' },
          { name: 'v2.schema.json', id: 'https://example.com/utility/logging/v2' },
        ],
      },
      {
        name: 'Monitoring',
        children: [{ name: 'v1.schema.json', id: 'https://example.com/utility/monitoring/v1' }],
      },
    ],
  },
];
