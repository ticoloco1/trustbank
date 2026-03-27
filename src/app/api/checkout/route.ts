import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Revenue splits by type
const SPLITS: Record<string, { creator: number; platform: number }> = {
  video:        { creator: 70, platform: 30 },
  cv:           { creator: 50, platform: 50 },
  subscription: { creator: 0,  platform: 100 },
  slug_sale:    { creator: 90, platform: 10 },
  slug_auction: { creator: 85, platform: 15 },
  slug_renewal: { creator: 0,  platform: 100 },
};

const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET!;
const HELIO_API_KEY   = process.env.NEXT_PUBLIC_HELIO_API_KEY!;
const SITE_URL        = process.env.NEXT_PUBLIC_SITE_URL!;

// Helio supports both crypto wallets AND credit card payments in the same paylink
// When user visits the paylink URL they can choose: USDC wallet OR card
export async function POST(req: Request) {
  try {
    const { items, userId, paymentMethod } = await req.json();

    if (!items?.length || !userId) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
    }
    if (!HELIO_API_KEY) {
      return NextResponse.json({ error: 'Helio API key não configurada' }, { status: 500 });
    }

    // Verify user exists
    const { data: user, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    const totalAmount = items.reduce((acc: number, item: any) => acc + (Number(item.price) || 0), 0);
    const purchaseType = items[0].type || 'video';
    const creatorWallet = items[0].creatorWallet;
    const itemIds = items.map((i: any) => i.id).join(',');

    const split = SPLITS[purchaseType];

    // Build split payments array for Helio
    const splitPayments: { address: string; share: number }[] = [];
    if (split && creatorWallet && split.creator > 0) {
      splitPayments.push({ address: creatorWallet, share: split.creator });
    }
    if (PLATFORM_WALLET) {
      splitPayments.push({ address: PLATFORM_WALLET, share: split?.platform ?? 100 });
    }

    // Whether to create a subscription (recurring) or one-time paylink
    const isSubscription = purchaseType === 'subscription';
    const endpoint = isSubscription
      ? 'https://api.helio.pay/v1/subscriptions/create'
      : 'https://api.helio.pay/v1/paylink/create/fixed';

    const body: Record<string, any> = {
      // Amount in USDC (Helio uses decimal, not cents)
      amount: totalAmount.toString(),
      currency: 'USDC',
      network: 'polygon',
      // Allow BOTH crypto wallet AND credit card — Helio shows the user a choice
      paymentMethods: ['crypto', 'card'],
      name: `TrustBank — ${purchaseType.toUpperCase().replace('_', ' ')}`,
      metaData: {
        user_id: userId,
        type: purchaseType,
        item_id: itemIds,
        payment_method_hint: paymentMethod || 'any',
      },
      returnUrl: `${SITE_URL}/dashboard?payment=success&type=${purchaseType}`,
      cancelUrl:  `${SITE_URL}/dashboard?payment=cancel`,
    };

    // Add split payments if applicable
    if (splitPayments.length > 0) {
      body.splitPayments = splitPayments;
    }

    // Subscriptions need interval
    if (isSubscription) {
      body.interval = 'month';
    }

    const helioRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HELIO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!helioRes.ok) {
      const errText = await helioRes.text();
      console.error('[Helio API Error]', helioRes.status, errText);
      return NextResponse.json({ error: 'Erro ao criar checkout na Helio' }, { status: 502 });
    }

    const data = await helioRes.json();

    // Helio returns paylinkUrl for fixed, url for subscriptions
    const checkoutUrl = data.paylinkUrl || data.url || data.checkoutUrl;

    if (!checkoutUrl) {
      console.error('[Helio] No URL returned:', data);
      return NextResponse.json({ error: 'Helio não retornou URL de pagamento' }, { status: 502 });
    }

    // Log the checkout attempt
    console.log(`[TrustBank Checkout] ${purchaseType} | User: ${userId} | Amount: $${totalAmount} USDC | Method: ${paymentMethod}`);

    return NextResponse.json({
      url: checkoutUrl,
      amount: totalAmount,
      currency: 'USDC',
      type: purchaseType,
    });

  } catch (error) {
    console.error('[Checkout Error]', error);
    return NextResponse.json({ error: 'Erro interno ao gerar checkout' }, { status: 500 });
  }
}
