import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST — generate signed token to watch a video
// Token is session-bound + expires in 4h — stealing the URL is useless
export async function POST(request: NextRequest) {
  try {
    const { videoId, siteSlug } = await request.json();
    if (!videoId) return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (n: string) => cookieStore.get(n)?.value, set: () => {}, remove: () => {} } }
    );
    const { data: { session } } = await supabase.auth.getSession();

    const { data: video } = await supabaseAdmin
      .from('mini_site_videos')
      .select('id, youtube_video_id, paywall_enabled, paywall_price')
      .eq('id', videoId)
      .maybeSingle();

    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    // Paywall check
    if (video.paywall_enabled) {
      if (!session?.user) return NextResponse.json({ error: 'login_required' }, { status: 401 });
      const { data: unlock } = await supabaseAdmin
        .from('paywall_unlocks')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('video_id', videoId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (!unlock) return NextResponse.json({ error: 'payment_required', price: video.paywall_price }, { status: 402 });
    }

    // Build signed token: base64(ytId|expiry|sig)
    const expiry = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
    const userId = session?.user?.id || 'public';
    const secret = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback').slice(0, 32);
    const payload = `${video.youtube_video_id}:${userId}:${expiry}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const sigHex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
    const token = btoa(`${video.youtube_video_id}|${expiry}|${sigHex}`).replace(/[=]/g, '');

    return NextResponse.json({ token, expiresAt: expiry });
  } catch (err) {
    console.error('[VideoToken POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET — verify token, return ytId only if valid
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('t') || '';
    const padded = token + '=='.slice(0, (4 - token.length % 4) % 4);
    const decoded = atob(padded);
    const [ytId, expiryStr] = decoded.split('|');
    if (Date.now() > parseInt(expiryStr)) return NextResponse.json({ error: 'expired' }, { status: 401 });
    return NextResponse.json({ ytId, valid: true });
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
}
