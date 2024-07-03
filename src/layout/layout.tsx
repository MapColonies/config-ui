import React from 'react';
import { Toolbar, List, ListItem, ListItemText, CssBaseline, Box, ListItemButton, ListItemIcon, Card, IconButton } from '@mui/material';
import { Settings as ConfigIcon, Description as SchemaIcon } from '@mui/icons-material';
import { routes } from '../routing/routes';
import { NavLink as NavLinkBase, NavLinkProps } from 'react-router-dom';
import Styles from './layout.module.scss';
import classNames from 'classnames';
import { useTheme } from '../hooks/useTheme';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>((props, ref) => {
  const { isDarkMode } = useTheme();
  const modeClass = isDarkMode ? Styles.darkModeLink : Styles.lightModeLink;
  const className = classNames(modeClass, props.className as string);
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
  const { isDarkMode, toggleTheme } = useTheme();
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
      <Box className={classNames(Styles.sideBar, isDarkMode ? '' : Styles.lightMode)}>
        <List>
          <Toolbar />
          {drawerItems.map((item) => (
            <ListItem component={NavLink} key={item.text} disablePadding to={item.navigatePath}>
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ alignSelf: 'center' }}>
          <IconButton onClick={toggleTheme} color="inherit">
            {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Box>
      <Box component="main" className={Styles.page} sx={{ p: 2 }}>
        <Card sx={{ height: '100%', p: 1 }}>{children}</Card>
      </Box>
    </Box>
  );
};
