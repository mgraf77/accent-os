export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Resolve API key: client-supplied x-api-key wins (lets power users use their own
    // account); otherwise fall back to the worker's bound secret so end-users never
    // need to configure anything. If both are missing, return a friendly 503 so the
    // client can degrade gracefully instead of hard-stopping the workflow.
    const clientKey = request.headers.get('x-api-key');
    const apiKey = clientKey || env.ANTHROPIC_API_KEY || null;
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'ai_unconfigured',
        message: 'AI service not configured. Set ANTHROPIC_API_KEY as a Workers secret.'
      }), {
        status: 503,
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
