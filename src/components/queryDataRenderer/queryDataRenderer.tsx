import { Box, CircularProgress, Typography } from '@mui/material';

type QueryDataRendererProps = {
  isLoading?: boolean;
  error?: Error | null;
  isSuccess?: boolean;
  children: React.ReactNode;
};

/**
 * Renders the data based on the query status.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {boolean} props.isLoading - Indicates whether the data is currently loading.
 * @param {Error | null} props.error - The error object if an error occurred during the query.
 * @param {boolean} props.isSuccess - Indicates whether the query was successful.
 * @param {ReactNode} props.children - The content to render when the query is successful.
 * @returns {ReactNode} The rendered component based on the query status.
 */
export const QueryDataRenderer: React.FC<QueryDataRendererProps> = ({ isLoading, error, isSuccess, children }) => {
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
