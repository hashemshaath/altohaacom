import { createClient } from 'npm:@supabase/supabase-js@2'
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse } from "../_shared/response.ts";
import { getServiceClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Extract token from query params (GET) or body (POST)
  const url = new URL(req.url);
  let token: string | null = url.searchParams.get('token');

  if (req.method === 'POST') {
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formText = await req.text();
      const params = new URLSearchParams(formText);
      if (!params.get('List-Unsubscribe')) {
        const formToken = params.get('token');
        if (formToken) token = formToken;
      }
    } else {
      try {
        const body = await req.json();
        if (body.token) token = body.token;
      } catch {
        // Fall through — token stays from query param
      }
    }
  }

  if (!token) return jsonResponse({ error: 'Token is required' }, 400);

  const supabase = getServiceClient();

  const { data: tokenRecord, error: lookupError } = await supabase
    .from('email_unsubscribe_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (lookupError || !tokenRecord) return jsonResponse({ error: 'Invalid or expired token' }, 404);
  if (tokenRecord.used_at) return jsonResponse({ valid: false, reason: 'already_unsubscribed' });

  // GET: Validate token
  if (req.method === 'GET') return jsonResponse({ valid: true });

  // POST: Process unsubscribe (atomic check-and-update)
  const { data: updated, error: updateError } = await supabase
    .from('email_unsubscribe_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)
    .is('used_at', null)
    .select()
    .maybeSingle();

  if (updateError) {
    console.error('Failed to mark token as used', { error: updateError, token });
    return jsonResponse({ error: 'Failed to process unsubscribe' }, 500);
  }

  if (!updated) return jsonResponse({ success: false, reason: 'already_unsubscribed' });

  const { error: suppressError } = await supabase
    .from('suppressed_emails')
    .upsert(
      { email: tokenRecord.email.toLowerCase(), reason: 'unsubscribe' },
      { onConflict: 'email' },
    );

  if (suppressError) {
    console.error('Failed to suppress email', { error: suppressError, email: tokenRecord.email });
    return jsonResponse({ error: 'Failed to process unsubscribe' }, 500);
  }

  console.log('Email unsubscribed', { email: tokenRecord.email });
  return jsonResponse({ success: true });
});
