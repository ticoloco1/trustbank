import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inicializamos o Admin com a Service Role Key que você já colocou na Vercel
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 });
    }

    // 1. Busca os dados do usuário no banco usando o Admin
    const { data: profile, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('youtube_url, verification_token')
      .eq('id', userId)
      .single();

    if (dbError || !profile?.youtube_url) {
      return NextResponse.json({ error: 'Perfil ou URL não encontrados' }, { status: 404 });
    }

    // 2. Acessa a página do YouTube (Vídeo ou Canal)
    // Adicionei um User-Agent para o YouTube não bloquear o fetch
    const response = await fetch(profile.youtube_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Compatible; TrustBankBot/1.0)'
      }
    });
    
    if (!response.ok) throw new Error('Não foi possível acessar o YouTube');
    
    const html = await response.text();

    // 3. Verifica se o link com o token está no HTML da página
    const expectedLink = `trustbank.xyz/verify/${profile.verification_token}`;
    const isPresent = html.includes(expectedLink);

    if (isPresent) {
      // 4. Se achou, marca como verificado no Supabase
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', userId);

      if (updateError) throw updateError;

      return NextResponse.json({ 
        success: true, 
        message: 'Canal verificado com sucesso!' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Link não encontrado na descrição. Verifique se o código está visível.' 
      });
    }
  } catch (error) {
    console.error('Erro na Verificação:', error);
    return NextResponse.json({ error: 'Erro ao processar verificação' }, { status: 500 });
  }
}
