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

    const text = await upstreamResponse.text();

    return new Response(text, {
      status: upstreamResponse.status,
      headers: {
        ...corsHeaders(request),
        'Content-Type':
          upstreamResponse.headers.get('content-type') ||
          'application/json; charset=utf-8',
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
