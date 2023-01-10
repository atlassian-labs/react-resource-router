import { compile } from 'path-to-regexp';

export const generatePath = (
  pattern = '/',
  params?: { [paramName: string]: string | number | boolean | null | void }
): string => (pattern === '/' ? pattern : compile(pattern)(params));
