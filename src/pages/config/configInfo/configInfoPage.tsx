import { Box, List, ListItem, ListItemText, Paper, Typography, Link as MuLink } from '@mui/material';
import { config } from '../../../api/client';
import React from 'react';
import { Link } from 'react-router-dom';

type ConfigInfoItemProps = {
  configInfoItem: ListData;
};

const ConfigInfoItem: React.FC<ConfigInfoItemProps> = ({ configInfoItem }) => {
  const { key, value } = configInfoItem;
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
};

type ConfigInfoPageProps = {
  configInfo: config;
};

type ListData = {
  key: string;
  value: string | number | React.ReactNode;
};

export const ConfigInfoPage: React.FC<ConfigInfoPageProps> = ({ configInfo }) => {
  const configInfoList: ListData[] = [
    { key: 'Name', value: configInfo.configName },
    { key: 'Version', value: configInfo.version },
    {
      key: 'Schema',
      value: (
        <MuLink component={Link} to={`/schema/view?schemaId=${configInfo.schemaId}`}>
          {configInfo.schemaId}
        </MuLink>
      ),
    },
    { key: 'Owner', value: configInfo.createdBy },
    { key: 'Created At', value: new Date(configInfo.createdAt).toLocaleString() },
  ];

  return (
    <Box>
      <Paper>
        <List>
          {configInfoList.map((configInfoItem) => {
            return <ConfigInfoItem key={configInfoItem.key} configInfoItem={configInfoItem} />;
          })}
        </List>
      </Paper>
    </Box>
  );
};
