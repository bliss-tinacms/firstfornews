import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { APIRoute } from 'astro';

export const prerender = false;

function getClientId() {
  return (
    import.meta.env.NEXT_PUBLIC_TINA_CLIENT_ID ||
    import.meta.env.PUBLIC_TINA_CLIENT_ID ||
    import.meta.env.TINA_PUBLIC_CLIENT_ID ||
    process.env.NEXT_PUBLIC_TINA_CLIENT_ID ||
    process.env.PUBLIC_TINA_CLIENT_ID ||
    process.env.TINA_PUBLIC_CLIENT_ID ||
    ''
  );
}

function getBranch() {
  return (
    import.meta.env.NEXT_PUBLIC_TINA_BRANCH ||
    import.meta.env.TINA_BRANCH ||
    process.env.NEXT_PUBLIC_TINA_BRANCH ||
    process.env.TINA_BRANCH ||
    'main'
  );
}

function getLocalHomepageData() {
  try {
    const filePath = join(process.cwd(), 'src', 'content', 'page', 'home.mdx');
    const parsed = matter(readFileSync(filePath, 'utf8'));
    return parsed.data && Object.keys(parsed.data).length ? parsed.data : null;
  } catch (_error) {
    return null;
  }
}

function queryTargetsHomepage(bodyText: string) {
  try {
    const payload = JSON.parse(bodyText || '{}');
    const variables = payload?.variables ?? {};
    const relativePath = variables.relativePath || variables.relativePath__homepage || variables.path;
    const query = String(payload?.query || '');
    return relativePath === 'home.mdx' && /\bpage\s*\(/.test(query);
  } catch (_error) {
    return false;
  }
}

function overrideHomepageResponse(text: string, bodyText: string) {
  if (!queryTargetsHomepage(bodyText)) return text;
  const localHome = getLocalHomepageData();
  if (!localHome) return text;
  try {
    const json = JSON.parse(text);
    if (json?.data?.page) {
      json.data.page = {
        ...json.data.page,
        ...localHome,
        _sys: json.data.page._sys ?? { filename: 'home', relativePath: 'home.mdx' },
      };
      return JSON.stringify(json);
    }
  } catch (_error) {
    return text;
  }
  return text;
}

function responseHasUnsupportedFieldError(text: string) {
  try {
    const json = JSON.parse(text);
    const errors = Array.isArray(json?.errors) ? json.errors : [];
    return errors.some((error) => /Cannot query field\s+\"(seo|experience|focus)\"/.test(String(error?.message || '')));
  } catch (_error) {
    return false;
  }
}

function stripUnsupportedLaggingSchemaFields(bodyText: string) {
  try {
    const payload = JSON.parse(bodyText || '{}');
    if (typeof payload.query !== 'string') return bodyText;

    // Tina Cloud schemas can lag behind deployed local source after adding
    // collection/block fields. Retry without optional fields instead of
    // crashing the admin content fetch.
    let query = payload.query;
    query = query.replace(/\bseo\s*\{[^{}]*\}/g, '');
    query = query.replace(/\bexperience\b/g, '');
    query = query.replace(/\bfocus\b/g, '');
    query = query.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');

    return JSON.stringify({ ...payload, query });
  } catch (_error) {
    return bodyText;
  }
}

function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') || 'https://firstfornews.net';
  const allowed = new Set([
    'https://firstfornews.net',
    'https://firstfornews.net',
    'http://localhost:4321',
  ]);

  return {
    'Access-Control-Allow-Origin': allowed.has(origin)
      ? origin
      : 'https://firstfornews.net',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-KEY',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export const OPTIONS: APIRoute = ({ request }) =>
  new Response(null, { status: 204, headers: corsHeaders(request) });

export const GET: APIRoute = ({ request }) =>
  new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

export const POST: APIRoute = async ({ request }) => {
  const clientId = getClientId();
  const branch = getBranch();

  if (!clientId) {
    return new Response(JSON.stringify({ error: 'Missing Tina Client ID' }), {
      status: 500,
      headers: {
        ...corsHeaders(request),
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }

  const upstream = `https://content.tinajs.io/2.4/content/${encodeURIComponent(
    clientId
  )}/github/${encodeURIComponent(branch)}`;

  const body = await request.text();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
    'Accept-Encoding': 'identity',
  };

  const authorization = request.headers.get('authorization');
  if (authorization) {
    headers.Authorization = authorization;
  }

  const apiKey =
    request.headers.get('x-api-key') ||
    import.meta.env.NEXT_PUBLIC_TINA_TOKEN ||
    import.meta.env.TINA_TOKEN ||
    process.env.NEXT_PUBLIC_TINA_TOKEN ||
    process.env.TINA_TOKEN ||
    '';

  if (apiKey) {
    headers['X-API-KEY'] = apiKey;
  }

  try {
    const upstreamResponse = await fetch(upstream, {
      method: 'POST',
      headers,
      body,
    });

    let text = overrideHomepageResponse(await upstreamResponse.text(), body);
    let status = upstreamResponse.status;
    let contentType = upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8';

    if (responseHasUnsupportedFieldError(text)) {
      const retryBody = stripUnsupportedLaggingSchemaFields(body);
      if (retryBody !== body) {
        const retryResponse = await fetch(upstream, {
          method: 'POST',
          headers,
          body: retryBody,
        });
        status = retryResponse.status;
        contentType = retryResponse.headers.get('content-type') || contentType;
        text = overrideHomepageResponse(await retryResponse.text(), retryBody);
      }
    }

    return new Response(text, {
      status,
      headers: {
        ...corsHeaders(request),
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-Splash-Tina-Proxy': 'astro-identity',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Tina proxy failed',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 502,
        headers: {
          ...corsHeaders(request),
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  }
};
