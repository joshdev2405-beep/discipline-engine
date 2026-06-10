import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const email = userData.user.email;
    if (!email) {
      // Guest with no email — skip silently
      return new Response(JSON.stringify({ skipped: true, reason: 'no_email' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ skipped: true, reason: 'no_api_key' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const subject = 'Thanks for your feedback — Discipline Engine';
    const bodyText =
      'Thank you for your feedback, we are reviewing any and all submissions to ensure users get the best experience. Any bugs or issues reported we will endeavour to repair as soon as possible.\n\n— The Discipline Engine Team';
    const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:32px;">
      <div style="max-width:560px;margin:0 auto;background:#111;border:1px solid #1f1f1f;border-radius:12px;padding:32px;">
        <h1 style="color:#10B981;font-size:18px;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 16px;">Discipline Engine</h1>
        <p style="line-height:1.6;color:#d4d4d4;">Thank you for your feedback, we are reviewing any and all submissions to ensure users get the best experience. Any bugs or issues reported we will endeavour to repair as soon as possible.</p>
        <p style="margin-top:24px;color:#737373;font-size:13px;">— The Discipline Engine Team</p>
      </div>
    </body></html>`;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Discipline Engine <onboarding@resend.dev>',
        to: [email],
        subject,
        text: bodyText,
        html,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Resend error:', resp.status, errText);
      return new Response(JSON.stringify({ error: 'send_failed', detail: errText }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await resp.json();
    return new Response(JSON.stringify({ sent: true, id: result.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-feedback-email error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});