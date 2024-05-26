import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Toolbar,
  ListItemText,
  Box,
} from "@mui/material";
import {
  Settings as ConfigIcon,
  Description as SchemaIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { routes } from "../routing/routes";

type LayoutProps = {
  children: React.ReactNode;
};

type DrawerItem = {
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const drawerItems: DrawerItem[] = [
    {
      text: "Config",
      icon: <ConfigIcon />,
      onClick: () => navigate(routes.CONFIG),
    },
    {
      text: "Schema",
      icon: <SchemaIcon />,
      onClick: () => navigate(routes.SCHEMA),
    },
  ];
  return (
    <Box>
      <Drawer variant="permanent" anchor="left">
        <Toolbar />
        <List>
          {drawerItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={item.onClick}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      {children}
    </Box>
  );
};
