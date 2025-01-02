import type { Route } from '../../types.tsx';

export class Node {
  children: { [key: string]: Node };

  // routes that match this node
  // this is an array because multiple routes can match the same path, but have different query params
  routes: Route[];

  // the level of the node in the tree, starting from 0
  level: number;

  // the segment pattern of the node e.g. '/:id'
  segmentPattern: string;

  constructor(level: number, segmentPattern: string) {
    this.children = {};
    this.routes = [];
    this.level = level;
    this.segmentPattern = segmentPattern;
  }
}

export class Tree {
  root: Node;

  // fallback route is the routes that match everything.
  // this is normally useful for 404 pages
  // we specifically handle this route for performance reason
  // because if we put it into the tree, it will always get traversed and has the least specificity.
  fallbackRoute: Route | null = null;

  constructor() {
    this.root = new Node(0, '');
  }

  insert(segmentPatterns: Array<string>, route: Route) {
    let current = this.root;
    for (let i = 0; i < segmentPatterns.length; i++) {
      const segmentPattern = segmentPatterns[i];
      if (!current.children[segmentPattern]) {
        current.children[segmentPattern] = new Node(i + 1, segmentPattern);
      }
      current = current.children[segmentPattern];
    }
    current.routes.push(route);
  }
}

const trim = (segmentPatterns: Array<string>) => {
  // remove the first empty string
  if (segmentPatterns[0] === '') segmentPatterns.shift();
  // remove the last empty string
  if (segmentPatterns[segmentPatterns.length - 1] === '') segmentPatterns.pop();
};

export const treeify = (
  routes: Route[],
  handler?: (route: Route, tree: Tree) => boolean
) => {
  const tree = new Tree();
  routes.forEach(route => {
    if (
      typeof route.path !== 'string' ||
      route.path === '' ||
      route.path === '/*' ||
      route.path === '*'
    ) {
      if (tree.fallbackRoute) {
        throw new Error(
          'There should be only one route that mates everything.'
        );
      }
      tree.fallbackRoute = route;

      return;
    }

    const handled =
      typeof handler === 'function' ? handler(route, tree) : false;

    if (!handled) {
      const segmentPatterns = route.path.split('/');
      trim(segmentPatterns);
      tree.insert(segmentPatterns, route);
    }
  });

  return tree;
};
