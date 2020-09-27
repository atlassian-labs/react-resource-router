import URL, { qs } from 'url-parse';

import { Href, Location, Query } from '../../../common/types';

const stripTrailingSlash = (path: string) =>
  path.charAt(path.length - 1) === '/' ? path.slice(0, -1) : path;

const addLeadingSlash = (path: string) =>
  path.charAt(0) === '/' ? path : '/' + path;

export const sanitizePath = (path: string, prefix = ''): string => {
  if (prefix) {
    prefix = stripTrailingSlash(prefix);
    prefix = addLeadingSlash(prefix);
    path = addLeadingSlash(path);
  }

  return prefix + path;
};

export const isAbsolutePath = (path: string): boolean => {
  const regex = new RegExp('^([a-z]+://|//)', 'i');

  return regex.test(path);
};

export const isExternalAbsolutePath = (path: Href | Location): boolean => {
  if (typeof path !== 'string' || !isAbsolutePath(path)) {
    return false;
  }

  const pathHostname = new URL(path).hostname;
  const currentHostname = new URL(window.location.href).hostname;

  return pathHostname !== currentHostname;
};

export const getRelativePath = (
  path: Href | Location,
  prefix = ''
): string | Location => {
  if (typeof path !== 'string') {
    return path;
  }

  if (!isAbsolutePath(path)) {
    path = sanitizePath(path, prefix);

    return path;
  }

  const url = new URL(path);

  return `${url.pathname}${url.query}${url.hash}`;
};

export const updateQueryParams = (location: Location, query: Query): string => {
  // @ts-ignore stringify accepts two params but it's type doesn't say so
  const stringifiedQuery = qs.stringify(query, true);

  return `${location.pathname}${stringifiedQuery}${location.hash}`;
};

export const getRelativeURLFromLocation = (location: Location): string => {
  return `${location.pathname}${location.search}${location.hash}`;
};
