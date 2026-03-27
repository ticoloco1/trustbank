import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 1. Isso gera os Backlinks para o Google subir o ranking
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: site } = await supabase
    .from('mini_sites')
    .select('site_name, bio, youtube_channel_id')
    .eq('slug', params.slug)
    .single();

  if (!site) return { title: 'Site não encontrado' };

  return {
    title: `${site.site_name} | TrustBank`,
    description: site.bio,
    alternates: {
      canonical: `https://${params.slug}.trustbank.xyz`,
    },
    // Cria a conexão de autoridade com o YouTube
    other: {
      'me': `https://www.youtube.com/channel/${site.youtube_channel_id}`,
    },
  };
}

export default async function SlugPage({ params }: { params: { slug: string } }) {
  // 2. Busca os dados do site
  const { data: site } = await supabase
    .from('mini_sites')
    .select('*, mini_site_links(*), mini_site_videos(*)')
    .eq('slug', params.slug)
    .single();

  // Se o site não existir ou não estiver pago/publicado
  if (!site || !site.published) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto text-center">
        {site.avatar_url && (
          <img src={site.avatar_url} className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-brand" />
        )}
        <h1 className="text-3xl font-bold">{site.site_name}</h1>
        <p className="text-gray-400 mt-2">{site.bio}</p>

        {/* Exemplo de exibição dos vídeos com Paywall */}
        <div className="mt-8 grid gap-4">
          {site.mini_site_videos?.map((video: any) => (
            <div key={video.id} className="p-4 border border-white/10 rounded-xl">
              <p>{video.title}</p>
              {/* Aqui você chamaria o seu componente PaywallModal */}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
