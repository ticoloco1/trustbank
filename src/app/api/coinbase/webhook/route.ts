import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { event } = await request.json();
    if (event?.type === 'charge:confirmed') {
      const metadata = event.data?.metadata || {};
      if (metadata.user_id) {
        await supabase.from('subscriptions' as any).upsert({
          user_id: metadata.user_id, plan: metadata.plan_id || 'pro',
          price: parseFloat(event.data?.pricing?.local?.amount || '0'),
          status: 'active',
          expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        });
        await supabase.from('mini_sites').update({ published: true }).eq('user_id', metadata.user_id);
      }
    }
    return NextResponse.json({ received: true });
  } catch { return NextResponse.json({ error: 'error' }, { status: 400 }); }
}
