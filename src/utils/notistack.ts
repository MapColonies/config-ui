import { OptionsObject } from 'notistack';

export const snackBarSuccessOptions: OptionsObject = {
  variant: 'success',
  anchorOrigin: { vertical: 'top', horizontal: 'right' },
  autoHideDuration: 3000,
};

export const snackBarErrorOptions: OptionsObject = {
  variant: 'error',
  anchorOrigin: { vertical: 'top', horizontal: 'right' },
  autoHideDuration: 5000,
};
