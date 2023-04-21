import { Match } from '../../../common/types';

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
