import URL, { qs } from 'url-parse';

import { Href, Location, Query } from '../../../common/types';

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

export const getRelativePath = (path: Href | Location): string | Location => {
  if (typeof path !== 'string' || !isAbsolutePath(path)) {
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
