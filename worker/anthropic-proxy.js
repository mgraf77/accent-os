export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method === 'GET') {
      return new Response(JSON.stringify({ ok: true, service: 'accentos-anthropic-proxy', version: 2, time: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing x-api-key header' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const body = await request.arrayBuffer();

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
    });

    const responseText = await upstream.text();

    return new Response(responseText, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
