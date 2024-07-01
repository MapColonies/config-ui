import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { red } from '@mui/material/colors';
import { CardHeader, Avatar } from '@mui/material';

export type ErrorCardProps = {
  title?: string;
  errorMessage: string | undefined;
};

export const ErrorCard: React.FC<ErrorCardProps> = ({ errorMessage, title }) => {
  const showError = errorMessage !== undefined;
  return (
    showError && (
      <Card sx={{ m: 2, boxShadow: 3 }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: red[500], width: '25px', height: '25px' }}>
              <ErrorOutlineIcon />
            </Avatar>
          }
          title={title ?? 'Error Occurred'}
          titleTypographyProps={{ variant: 'body1', color: 'error', fontWeight: 'bold' }}
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {errorMessage}
          </Typography>
        </CardContent>
      </Card>
    )
  );
};

export default ErrorCard;
