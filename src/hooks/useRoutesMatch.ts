import { matchPath, useLocation } from 'react-router-dom';

export function useRouteMatch(patterns: readonly string[]) {
  const { pathname } = useLocation();

  for (let i = 0; i < patterns.length; i += 1) {
    const pattern = patterns[i];
    console.log('withQuery', pattern);
    const patternWithoutQuery = pattern;
    console.log('without query', patternWithoutQuery);

    const possibleMatch = matchPath(patternWithoutQuery, pathname);
    if (possibleMatch !== null) {
      return possibleMatch;
    }
  }

  return null;
}
