import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { useRouteMatch } from '../../hooks/useRoutesMatch';
import { Link } from 'react-router-dom';

export type RouteTab = {
  label: string;
  path: string;
  component?: React.ReactNode;
};

export type CustomTabsProps = {
  tabs: RouteTab[];
};

export const CustomTabs: React.FC<CustomTabsProps> = ({ tabs }) => {
  const routesMatch = tabs.map((tab) => tab.path);

  const routeMatch = useRouteMatch(routesMatch);

  const currentTab = routeMatch?.pattern?.path;
  return (
    <>
      <Tabs value={currentTab}>
        {tabs.map((tab) => (
          <Tab key={tab.path} label={tab.label} value={tab.path} component={Link} to={tab.path} />
        ))}
      </Tabs>
      <Box sx={{ width: '100%' }}>{currentTab && tabs.find((tab) => tab.path === currentTab)?.component}</Box>
    </>
  );
};
