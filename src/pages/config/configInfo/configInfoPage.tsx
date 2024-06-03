import { Box, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';
import { config } from '../../../api/client';
import React from 'react';
import { Link } from 'react-router-dom';

type ConfigInfoPageProps = {
  configInfo: config | undefined;
};

type ListData = {
  key: string;
  value: string | number | React.ReactNode;
};

export const ConfigInfoPage: React.FC<ConfigInfoPageProps> = ({ configInfo }) => {
  if (!configInfo) {
    return <div>Config not found</div>;
  }

  const configTPresent: ListData[] = [
    { key: 'Name', value: configInfo.configName },
    { key: 'Version', value: configInfo.version },
    { key: 'Schema', value: <Link to={`/schema/view?id=${configInfo.schemaId}`}>{configInfo.schemaId}</Link> },
    { key: 'Owner', value: configInfo.createdBy },
    { key: 'Created At', value: new Date(configInfo.createdAt).toLocaleString() },
  ];

  return (
    <Box>
      <Paper>
        <List>
          {configTPresent.map(({ key, value }) => {
            return (
              <ListItem key={key} alignItems="flex-start">
                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight="bold" sx={{ textDecoration: 'underline' }}>
                      {key}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="textSecondary">
                      {value}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Paper>
    </Box>
  );
};
