import URL from 'url-parse';

export function parsePath(path: string) {
  const url = new URL(path, 'ws://a.a');
  const isAbsolute = path.startsWith('/');

  const pathname =
    isAbsolute || url.pathname === '/' ? url.pathname : url.pathname.slice(1);

  return {
    pathname,
    search: (url.query as any) as string,
    hash: url.hash,
  };
}
