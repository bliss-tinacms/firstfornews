import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineMiddleware } from 'astro:middleware';

type RedirectRule = {
  enabled?: boolean;
  source?: string;
  destination?: string;
  permanent?: boolean;
};

function readRedirects(): RedirectRule[] {
  try {
    const filePath = join(process.cwd(), 'src', 'content', 'config', 'config.json');
    const config = JSON.parse(readFileSync(filePath, 'utf8'));
    return Array.isArray(config?.redirects) ? config.redirects : [];
  } catch (_error) {
    return [];
  }
}

function normalizePath(path: string) {
  if (!path) return '/';
  const withoutOrigin = path.replace(/^https?:\/\/[^/]+/i, '');
  const withoutQuery = withoutOrigin.split('?')[0].split('#')[0] || '/';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return withLeadingSlash.replace(/\/+/g, '/');
}

function pathMatches(source: string, pathname: string) {
  const normalizedSource = normalizePath(source);
  const normalizedPath = normalizePath(pathname);
  if (normalizedSource === normalizedPath) return true;
  if (normalizedSource !== '/' && normalizedSource.endsWith('/')) {
    return normalizedSource.slice(0, -1) === normalizedPath;
  }
  if (normalizedSource !== '/' && !normalizedSource.endsWith('/')) {
    return `${normalizedSource}/` === normalizedPath;
  }
  return false;
}

function getPublicOrigin(request: Request, requestUrl: URL) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || requestUrl.host;
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const proto = forwardedProto || (host.includes('localhost') || host.startsWith('127.0.0.1') ? requestUrl.protocol.replace(':', '') : 'https');
  return `${proto}://${host}`;
}

function buildDestination(destination: string, request: Request, requestUrl: URL) {
  const target = destination.trim();
  const url = new URL(target, getPublicOrigin(request, requestUrl));
  if (!url.search && requestUrl.search) url.search = requestUrl.search;
  return url;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;
  const method = request.method.toUpperCase();

  // Keep POST/API/admin/asset requests out of redirect management.
  if (method !== 'GET' && method !== 'HEAD') return next();
  if (
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/_astro') ||
    url.pathname.startsWith('/tina-content-proxy') ||
    url.pathname.startsWith('/tina-island') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/robots.txt' ||
    url.pathname === '/sitemap-index.xml' ||
    url.pathname === '/rss.xml'
  ) {
    return next();
  }

  const redirects = readRedirects();
  for (const redirect of redirects) {
    if (!redirect || redirect.enabled === false) continue;
    if (!redirect.source || !redirect.destination) continue;
    if (!pathMatches(redirect.source, url.pathname)) continue;

    const destination = buildDestination(redirect.destination, request, url);
    if (destination.pathname === url.pathname && destination.origin === url.origin) continue;

    return Response.redirect(destination, redirect.permanent === false ? 302 : 301);
  }

  return next();
});
