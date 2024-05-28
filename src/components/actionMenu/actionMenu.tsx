import { MoreVert } from '@mui/icons-material';
import { IconButton, Menu } from '@mui/material';
import { useState } from 'react';

export const ActionMenu: React.FC<{ children: React.ReactNode[] }> = ({ children }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <MoreVert />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {children}
      </Menu>
    </>
  );
};
