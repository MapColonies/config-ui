import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { CardHeader, Avatar } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { red, blue, green, orange } from '@mui/material/colors';

export type CardVariant = 'error' | 'info' | 'success' | 'warning';

export type DetailCardProps = {
  variant: CardVariant;
  title?: string;
  message: string | React.ReactNode | undefined;
};

const variantConfig = {
  error: {
    icon: ErrorOutlineIcon,
    color: red[500],
    defaultTitle: 'Error Occurred',
  },
  info: {
    icon: InfoOutlinedIcon,
    color: blue[500],
    defaultTitle: 'Information',
  },
  success: {
    icon: CheckCircleOutlineIcon,
    color: green[500],
    defaultTitle: 'Success',
  },
  warning: {
    icon: WarningAmberIcon,
    color: orange[500],
    defaultTitle: 'Warning',
  },
};

export const DetailCard: React.FC<DetailCardProps> = ({ variant, message, title }) => {
  const { icon: Icon, color, defaultTitle } = variantConfig[variant];

  return (
    <Card sx={{ m: 2, boxShadow: 3 }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: color, width: '25px', height: '25px' }}>
            <Icon />
          </Avatar>
        }
        title={title ?? defaultTitle}
        titleTypographyProps={{ variant: 'body1', color: variant, fontWeight: 'bold' }}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DetailCard;
