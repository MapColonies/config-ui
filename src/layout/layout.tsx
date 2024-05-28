import React from 'react';
import { Toolbar, List, ListItem, ListItemText, CssBaseline, Box, ListItemButton, ListItemIcon } from '@mui/material';
import { Settings as ConfigIcon, Description as SchemaIcon } from '@mui/icons-material';
import { routes } from '../routing/routes';
import { useNavigate } from 'react-router-dom';
import Styles from './layout.module.scss';

type LayoutProps = {
  children: React.ReactNode;
};

type DrawerItem = {
  id: number;
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
};
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [selectedButtonIndex, setSelectedButtonIndex] = React.useState<number>(0);

  const drawerItems: DrawerItem[] = [
    {
      id: 1,
      text: 'Config',
      icon: <ConfigIcon />,
      onClick: () => navigate(routes.CONFIG),
    },
    {
      id: 2,
      text: 'Schema',
      icon: <SchemaIcon />,
      onClick: () => navigate(routes.SCHEMA),
    },
  ];

  return (
    <Box className={Styles.container}>
      <CssBaseline />
      <Box className={Styles.sideBar}>
        <Toolbar />
        <List>
          {drawerItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={selectedButtonIndex === item.id}
                onClick={() => {
                  item.onClick();
                  setSelectedButtonIndex(item.id);
                }}
              >
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
