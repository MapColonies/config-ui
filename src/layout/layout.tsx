import React from 'react';
import { Toolbar, List, ListItem, ListItemText, CssBaseline, Box, ListItemButton, ListItemIcon } from '@mui/material';
import { Settings as ConfigIcon, Description as SchemaIcon } from '@mui/icons-material';
import { routes } from '../routing/routes';
import { NavLink as NavLinkBase, NavLinkProps } from 'react-router-dom';
import Styles from './layout.module.scss';
import classNames from 'classnames';

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>((props, ref) => {
  const className = props.className as string;
  const selectedClass = classNames(className, 'Mui-selected');
  return <NavLinkBase ref={ref} {...props} className={({ isActive }): string => (isActive ? selectedClass : className)} />;
});

type LayoutProps = {
  children: React.ReactNode;
};
type DrawerItem = {
  id: number;
  text: string;
  icon: React.ReactNode;
  navigatePath: string;
};
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const drawerItems: DrawerItem[] = [
    {
      id: 1,
      text: 'Configs',
      icon: <ConfigIcon />,
      navigatePath: routes.CONFIG,
    },
    {
      id: 2,
      text: 'Schemas',
      icon: <SchemaIcon />,
      navigatePath: routes.SCHEMA,
    },
  ];
  return (
    <Box className={Styles.container}>
      <CssBaseline />
      <Box className={Styles.sideBar}>
        <Toolbar />
        <List>
          {drawerItems.map((item) => (
            <ListItem component={NavLink} key={item.text} disablePadding to={item.navigatePath}>
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Box component="main" className={Styles.page} sx={{ p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};
