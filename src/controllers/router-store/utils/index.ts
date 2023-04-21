import URL, { qs } from 'url-parse';

import { Href, Location, Query, Match } from '../../../common/types';

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

type ObjectToCompare = {
  [key: string]: string | null | typeof undefined;
};
const isDeepEqual = (object1: ObjectToCompare, object2: ObjectToCompare) => {
  const objKeys1 = Object.keys(object1);
  const objKeys2 = Object.keys(object2);

  if (objKeys1.length !== objKeys2.length) return false;

  for (const key of objKeys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }

  return true;
};

export const isSameRoute = ({
  prevContextMatch,
  nextContextMatch,
}: {
  prevContextMatch: Match;
  nextContextMatch: Match;
}) =>
  prevContextMatch.path === nextContextMatch.path &&
  isDeepEqual(prevContextMatch.query, nextContextMatch.query) &&
  isDeepEqual(prevContextMatch.params, nextContextMatch.params);
