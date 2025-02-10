import { pathToRegexp } from 'path-to-regexp';
import { qs } from 'url-parse';

import { Query, Routes, Route } from '../../types';
import execRouteMatching from '../match-route/exec-route-matching';
import matchQuery from '../match-route/matchQuery';

import { type Tree, Node, treeify } from './tree';
import { matchRouteCache } from './utils';

function pushOrUnshiftByCaptureGroup(arr: Node[], node: Node) {
  if (node.segmentPattern.includes('(') && node.segmentPattern.includes(')')) {
    // if the segmentPattern has capturing group, it's more specific
    // so we place it at the beginning of the array
    arr.unshift(node);
  } else {
    // otherwise place at the end of the array
    arr.push(node);
  }
}

// Find matching nodes by segment
// sort the nodes by specificity
function matchChildren(node: Node, segments: string[]) {
  // how do we define specificity? This is a tricky question.
  // the specificity goes like this:
  // 1. if the segment is an exact match, of course it's the most specific
  // 2. the rest is regex match, within the regex match, we have to consider:
  // 		2.1 the length of segments and if node has descendants. /jira/:id/summary is more specific than /jira/:id if the request URL is /jira/123/summary
  // 3 after checking the length, we have to consider if the segmentPattern has any capturing group. /jira/:id(\d+) is more specific than /jira/:id
  //
  // This is not a comprehensive solution to the specificity problem
  // I will use production urls to verify this heuristic

  const exactMatch: Node[] = []; // segment is an exact match e.g. /jira matches /jira
  const lengthMatch: Node[] = []; // check #2.1 from the above comment
  const rest: Node[] = [];

  const { children } = node;
  // treat url segment as empty string if it's undefined
  // possible if we have optional segmentPattern
  const segment = segments[node.level] || '';
  // check if there is next segment
  const hasNextSegment = segments.length > node.level;

  for (const segmentPattern in children) {
    if (Object.prototype.hasOwnProperty.call(children, segmentPattern)) {
      const child = children[segmentPattern];

      if (segment === segmentPattern) {
        // we have exact segment match
        exactMatch.push(child);
      } else {
        const regex = pathToRegexp(segmentPattern, [], {
          end: true,
          strict: true,
          sensitive: false,
        });
        if (regex.test(segment)) {
          const nodeAhasChildren = Object.keys(child.children).length > 0;

          if (hasNextSegment && nodeAhasChildren) {
            // if there is a next segment, we should prioritize nodes with children
            pushOrUnshiftByCaptureGroup(lengthMatch, child);
          } else if (!hasNextSegment && !nodeAhasChildren) {
            // if there is no next segment, we should prioritize nodes without children
            pushOrUnshiftByCaptureGroup(lengthMatch, child);
          } else {
            pushOrUnshiftByCaptureGroup(rest, child);
          }
        }
      }
    }
  }

  return [...exactMatch, ...lengthMatch, ...rest];
}

function recursivelyFindOptionalNodes(node: Node, queryParams: Query = {}) {
  const { segmentPattern, children, routes } = node;

  if (segmentPattern.endsWith('?')) {
    const maybeMatchedRoute = matchRoutesByQuery(routes, queryParams);
    if (maybeMatchedRoute) {
      return maybeMatchedRoute;
    }
    for (const key in children) {
      if (Object.prototype.hasOwnProperty.call(children, key)) {
        return recursivelyFindOptionalNodes(children[key]);
      }
    }
  }
}

function matchRoutesByQuery(routes: Route[], queryParamObject: Query) {
  if (routes.length === 0) return null;

  // why do we sort the routes by query length?
  // because we want to match the most specific route first
  // and we assume that the more query params a route has, the more specific it is
  // of course, this is a heuristic and is prehaps not true in all cases but good enough for now
  const sortedRoutes = routes.sort((a, b) => {
    const aQueryLength = a.query?.length || 0;
    const bQueryLength = b.query?.length || 0;

    return bQueryLength - aQueryLength;
  });

  const filterRoutes = sortedRoutes.filter(route => {
    // if route has no query, anything query param will match
    if (route.query === undefined) return true;
    // we will get a real match from the execRouteMatching function later
    const fakeMatch = {
      params: {},
      query: {},
      isExact: false,
      path: '',
      url: '',
    };

    return !!matchQuery(route.query, queryParamObject, fakeMatch);
  });

  if (filterRoutes.length) {
    // return the first (most specific) route that matches the query
    return filterRoutes[0];
  }

  return null;
}

const findRoute = (
  tree: Tree,
  p: string,
  queryParams: Query = {},
  basePath: string
) => {
  const pathname = p.replace(basePath, '');
  // split the pathname into segments
  // e.g. /jira/projects/123 => ['', 'jira', 'projects', '123']
  const segments = pathname.split('/');

  // remove the first empty string
  if (segments[0] === '') segments.shift();
  // remove the last empty string
  if (segments[segments.length - 1] === '') segments.pop();

  // a first-in-first-out stack to keep track of the nodes we need to visit
  // start with the root node
  const stack: Array<Node | Route> = [tree.root];

  let count = 0;
  const maxCount = 2000; // to prevent infinite loop

  // when we exacust the stack and can't find a match, means nothing matches
  while (stack.length > 0 && count < maxCount) {
    count += 1;
    // pop the first node from the stack
    const node = stack.shift();

    // to make TypeScript happy. It's impossible to have a null node
    if (!node) return null;

    // if the node is a Route, it means we have traversed its children and cannot find a higher specificity match
    // we should return this route
    if (!(node instanceof Node)) {
      // we found a match
      return node;
    }

    const { children, routes, level } = node;

    let maybeMatchedRoute = null;
    let shouldMatchChildren = true;

    if (Object.keys(children).length === 0) {
      // we've reached the end of a branch

      if (!routes.length) {
        throw new Error('It should have a route at the end of a branch.');
      }

      // let's match query
      maybeMatchedRoute = matchRoutesByQuery(routes, queryParams);

      if (maybeMatchedRoute) {
        // do we have more segments to match with?
        if (segments.length > level) {
          // we have more segments to match but this branch doesn't have any children left

          // let's check if the route has `exact: true`.
          if (maybeMatchedRoute.exact) {
            // let's go to another branch.
            maybeMatchedRoute = null;
          }
        }
      }
    } else if (segments.length === level) {
      // we've reached the end of the segments

      // does the node have a route?
      if (routes.length) {
        // let's match query
        maybeMatchedRoute = matchRoutesByQuery(routes, queryParams);
      }
    } else if (segments.length < level) {
      // we've exceeded the segments and shouldn't match children anymore
      shouldMatchChildren = false;

      // we check if this node and its children are optional
      // e.g. `/:a?/:b?/:c?` matches `/`
      // we check if `/:a?` node has a route, if `/:b?` node has a route, and if `/:c?` node has a route
      // if any of them has a route, we have a match
      maybeMatchedRoute = recursivelyFindOptionalNodes(node, queryParams);
    } else {
      // there are more segments to match and this node has children

      // we need to check if this node has a route that has `exact: false`
      // if it has, we have a potential match. We will unshift it to the stack.
      // we will continue to check the children of this node to see if we can find a more specific match
      // let's match query
      const lowSpecifityRoute = matchRoutesByQuery(routes, queryParams);
      if (lowSpecifityRoute && !lowSpecifityRoute.exact) {
        // we have a potential match
        stack.unshift(lowSpecifityRoute);
      }
    }

    // yay, we found a match
    if (maybeMatchedRoute) {
      return maybeMatchedRoute;
    }

    if (shouldMatchChildren) {
      // if we haven't found a match, let's check the current node's children
      const nodes = matchChildren(node, segments);
      // add potential matched children to the stack
      stack.unshift(...nodes);
    }
    // go back to the beginning of the loop, pop out the next node from the stack, and repeat
  }

  return null;
};

function execRouteMatchingAndCache(
  route: Route | null,
  pathname: string,
  queryParamObject: Query,
  basePath: string
) {
  if (route) {
    const matchedRoute = execRouteMatching(
      route,
      pathname,
      queryParamObject,
      basePath
    );

    if (matchedRoute) {
      matchRouteCache.set(pathname, queryParamObject, basePath, matchedRoute);

      return matchedRoute;
    }
  }

  return null;
}

const matchRoute = (
  routes: Routes,
  pathname: string,
  queryParams: Query = {},
  basePath = ''
) => {
  const queryParamObject =
    typeof queryParams === 'string'
      ? (qs.parse(queryParams) as Query)
      : queryParams;

  const cachedMatch = matchRouteCache.get<Route>(
    pathname,
    queryParamObject,
    basePath
  );
  if (cachedMatch && routes.includes(cachedMatch.route)) return cachedMatch;

  // fast return if there is no route or only one route
  if (routes.length === 0) return null;
  if (routes.length === 1)
    return execRouteMatchingAndCache(
      routes[0],
      pathname,
      queryParamObject,
      basePath
    );

  const tree = treeify(routes);
  const route =
    findRoute(tree, pathname, queryParamObject, basePath) || tree.fallbackRoute;

  return execRouteMatchingAndCache(route, pathname, queryParamObject, basePath);
};

export const matchRouteByTree = (
  tree: Tree,
  pathname: string,
  queryParams: Query = {},
  basePath = ''
) => {
  const queryParamObject =
    typeof queryParams === 'string'
      ? (qs.parse(queryParams) as Query)
      : queryParams;

  const route =
    findRoute(tree, pathname, queryParamObject, basePath) || tree.fallbackRoute;

  if (route) {
    return execRouteMatching(route, pathname, queryParamObject, basePath);
  }

  return null;
};

export default matchRoute;
