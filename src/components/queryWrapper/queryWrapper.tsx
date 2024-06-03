import { Box, CircularProgress, Typography } from '@mui/material';

type queryWrapperProps = {
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
  children: React.ReactNode;
};

export const QueryWrapper: React.FC<queryWrapperProps> = ({ isLoading, error, isSuccess, children }) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">An error occurred: {error.message}</Typography>
      </Box>
    );
  }

  if (isSuccess) {
    return <>{children}</>;
  }

  return null;
};
