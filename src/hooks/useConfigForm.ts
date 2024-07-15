import { useContext } from 'react';
import { ConfigFormContext } from '../context/configContext';

export const useConfigForm = () => {
  const context = useContext(ConfigFormContext);
  if (!context) {
    throw new Error('useConfigForm must be used within a ConfigFormProvider');
  }
  return context;
};
