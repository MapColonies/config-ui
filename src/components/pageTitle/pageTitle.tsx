import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type PageTitleProps = {
  title: string;
};

export const PageTitle: React.FC<PageTitleProps> = ({ title }) => {
  const location = useLocation();

  useEffect(() => {
    document.title = title;
  }, [location, title]);

  return null;
};
