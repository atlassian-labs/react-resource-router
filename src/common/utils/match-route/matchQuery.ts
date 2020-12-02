import { Match, MatchParams, Query } from '../../types';

/**
 * Matches `queryStr` against config stored in `queryConfig`.
 *
 * Returns `pathMatch` with an additional query prop with query params if the match succeeds,
 * otherwise returns null.
 *
 */
function matchQuery(
  queryConfig: string[],
  queryParams: MatchParams,
  pathMatch: Match
): Match | null {
  const queryMatch: Query = {};
  const isMatchingQuery = queryConfig.every(query => {
    // eslint-disable-next-line prefer-const
    let [names, value] = query.split('=');
    let negation = false;

    /* Check if negative matching query param (eg 'foo!=1') */
    if (query.includes('!=')) {
      names = names.substring(0, names.length - 1);
      negation = true;
    }

    /* Allow alternate query params presence (eg 'foo|bar') */
    const matched = names.split('|').map(name => {
      let isOptional = false;

      /* Check if optional query param (eg 'foo?') */
      if (name.includes('?')) {
        // eslint-disable-next-line no-param-reassign
        name = name.substring(0, name.length - 1);
        isOptional = true;
      }

      /* First check if queryParams contains the relevant param */
      let match = Object.prototype.hasOwnProperty.call(queryParams, name);
      /* Save actual value so we expose it as part of match object */
      if (match) {
        queryMatch[name] = queryParams[name] || '';
      }

      /* If no value matching required or it is optional and the param is missing */
      if (!value || (isOptional && !match)) {
        return isOptional || match;
      }

      if (value.startsWith('(')) {
        /* Handle value being a regexp eg 's=(\\d+)' */
        match = new RegExp(`^${value}$`).test(queryParams[name] || '');
      } else {
        /* Handle value exact matching eg 's=123' */
        match = queryParams[name] === value;
      }

      return negation ? !match : match;
    });

    /* If at least one of alternate query params matches then it is a match */
    return matched.includes(true);
  });

  return isMatchingQuery ? { ...pathMatch, query: queryMatch } : null;
}

export default matchQuery;
