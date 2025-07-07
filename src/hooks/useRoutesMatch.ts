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

  // If no exact match but we're on a config info page, default to the first tab
  // This handles the case where users navigate to /config/:name/:version/:schemaId
  // and we want to show the Info tab by default
  if (patterns.length > 0 && pathname.match(/^\/config\/[^\/]+\/[^\/]+\/[^\/]+\/?$/)) {
    return patterns[0];
  }

  return null;
}
