/**
 * Cloudflare Worker Entry point:
 * 1. Proxies /api/* requests to production backend API_ORIGIN (configured via Cloudflare environment variables)
 * 2. Serves static assets from ./dist via env.ASSETS binding
 * 3. Fallback to /index.html for SPA routing
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. API Request Proxy (/api/*)
    if (url.pathname.startsWith('/api/')) {
      const apiOrigin = env.API_ORIGIN;

      if (!apiOrigin) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Production API_ORIGIN not configured. Please set the API_ORIGIN environment variable in Cloudflare Workers settings.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const targetOrigin = apiOrigin.replace(/\/+$/, '');
      const targetUrl = new URL(url.pathname + url.search, targetOrigin);

      const reqHeaders = new Headers(request.headers);
      reqHeaders.set('X-Forwarded-Host', url.host);
      reqHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

      const init = {
        method: request.method,
        headers: reqHeaders,
        redirect: 'follow'
      };

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase())) {
        init.body = await request.arrayBuffer();
      }

      try {
        const response = await fetch(targetUrl.toString(), init);
        const resHeaders = new Headers(response.headers);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: resHeaders
        });
      } catch (err) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `API Proxy Error connecting to ${targetOrigin}: ${err.message}`
          }),
          {
            status: 502,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // 2. Static Assets & SPA Fallback
    try {
      if (env.ASSETS) {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          return assetResponse;
        }

        // SPA Fallback: for non-API non-asset paths, return index.html
        const indexUrl = new URL('/index.html', request.url);
        return await env.ASSETS.fetch(indexUrl);
      }
    } catch (e) {}

    return new Response('Not Found', { status: 404 });
  }
};
