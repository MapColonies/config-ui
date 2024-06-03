import { matchPath, useLocation } from 'react-router-dom';

export function useRouteMatch(patterns: readonly string[]): string | null {
  const { pathname } = useLocation();

  const possibleMatch = patterns.find((pattern) => {
    const possibleMatch = matchPath(pattern, pathname);
    return possibleMatch !== null;
  });

  if (possibleMatch !== undefined) {
    return possibleMatch;
  }

  return null;
}
