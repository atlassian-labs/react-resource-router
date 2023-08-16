import { Match } from '../../../common/types';

type ObjectToCompare = Record<string, string | null | undefined>;

const isShallowEqual = (o1: ObjectToCompare, o2: ObjectToCompare) => {
  const objKeys1 = Object.keys(o1);
  const objKeys2 = Object.keys(o2);

  if (objKeys1.length !== objKeys2.length) return false;

  return objKeys1.every(key => o1[key] === o2[key]);
};

export const isSameRouteMatch = ({
  prevContextMatch,
  nextContextMatch,
}: {
  prevContextMatch: Match;
  nextContextMatch: Match;
}) =>
  prevContextMatch.path === nextContextMatch.path &&
  isShallowEqual(prevContextMatch.query, nextContextMatch.query) &&
  isShallowEqual(prevContextMatch.params, nextContextMatch.params);
