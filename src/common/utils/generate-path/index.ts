import pathToRegexp from 'path-to-regexp';

const generatePath = (
  pattern: string = '/',
  params?: { [paramName: string]: string | number | boolean | null | void },
): string =>
  pattern === '/' ? pattern : pathToRegexp.compile(pattern)(params);

export default generatePath;
