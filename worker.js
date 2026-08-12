/**
 * Cloudflare Worker Entry point:
 * 1. Proxies /api/* requests to production backend API_ORIGIN (configured via Cloudflare environment variables)
 * 2. Serves static assets from ./dist via env.ASSETS binding
 * 3. Injects runtime config (window.__AMUSEMAC_CONFIG__) into HTML responses if Cloudflare env variables are set
 * 4. Fallback to /index.html for SPA routing
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. API Request Proxy (/api/*)
    if (url.pathname.startsWith('/api/')) {
      const apiOrigin = env.API_ORIGIN || 'https://amusemac-growth-backend.onrender.com';
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

    // Helper: Inject runtime config window.__AMUSEMAC_CONFIG__ into HTML responses
    const googleClientId = env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || '';
    const paymentCheckoutUrl = env.VITE_PAYMENT_CHECKOUT_URL || env.PAYMENT_CHECKOUT_URL || '';

    if (googleClientId) {
      console.log('[Cloudflare Worker] GOOGLE_CLIENT_ID CONFIG PRESENT');
    } else {
      console.log('[Cloudflare Worker] GOOGLE_CLIENT_ID CONFIG MISSING');
    }

    const injectRuntimeConfig = async (assetResponse) => {
      const contentType = assetResponse.headers.get('content-type') || '';
      if (googleClientId && contentType.includes('text/html')) {
        let html = await assetResponse.text();
        const safeConfig = {
          GOOGLE_CLIENT_ID: googleClientId,
          PAYMENT_CHECKOUT_URL: paymentCheckoutUrl
        };
        const configScript = `<script>window.__AMUSEMAC_CONFIG__=${JSON.stringify(safeConfig)};</script>`;
        if (html.includes('</head>')) {
          html = html.replace('</head>', `${configScript}</head>`);
        } else {
          html = configScript + html;
        }
        const newHeaders = new Headers(assetResponse.headers);
        newHeaders.delete('content-length');
        return new Response(html, {
          status: assetResponse.status,
          statusText: assetResponse.statusText,
          headers: newHeaders
        });
      }
      return assetResponse;
    };

    // 2. Static Assets & SPA Fallback
    try {
      if (env.ASSETS) {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          return await injectRuntimeConfig(assetResponse);
        }

        // SPA Fallback: for non-API non-asset paths, return index.html
        const indexUrl = new URL('/index.html', request.url);
        const indexResponse = await env.ASSETS.fetch(indexUrl);
        return await injectRuntimeConfig(indexResponse);
      }
    } catch (e) {}

    return new Response('Not Found', { status: 404 });
  }
};
