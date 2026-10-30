/** SYNTERX Cloudflare Workers adapter. Original V6 API and webhook routes preserved. */
import api from '../functions/api.mjs';
import webhook from '../functions/stripe-webhook.mjs';

const secure = { 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'strict-origin-when-cross-origin' };
const fail = (status, error) => new Response(JSON.stringify({ok:false,error}), {status,headers:{...secure,'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/.netlify/functions/api') {
        const response = await api(request);
        const headers = new Headers(response.headers);
        for (const [key,value] of Object.entries(secure)) headers.set(key,value);
        return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
      }
      if (url.pathname === '/.netlify/functions/stripe-webhook') {
        const response = await webhook(request);
        const headers = new Headers(response.headers);
        for (const [key,value] of Object.entries(secure)) headers.set(key,value);
        return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
      }
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ok:true,service:'synterx-cloudflare'}),{headers:{...secure,'content-type':'application/json'}});
      }
      if (!['GET','HEAD'].includes(request.method)) return fail(405,'Method not allowed');
      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      for (const [key,value] of Object.entries(secure)) headers.set(key,value);
      return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
    } catch(err) {
      console.error('SYNTERX Worker error:',String(err?.message || err));
      return fail(500,'Server error');
    }
  }
};
