'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/store/cart';
import { Send, Pin, Trash2, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Countdown } from '@/components/ui/Countdown';
import { timeAgo } from '@/lib/utils';

interface Props {
  siteId: string;
  isOwner: boolean;
  accentColor?: string;
}

export function FeedSection({ siteId, isOwner, accentColor = '#818cf8' }: Props) {
  const { user } = useAuth();
  const { add: addToCart, open: openCart } = useCart();
  const [posts, setPosts] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [nextExpiry, setNextExpiry] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('feed_posts' as any)
      .select('*')
      .eq('site_id', siteId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30);
    const now = new Date();
    const active = (data || []).filter((p: any) => p.pinned || new Date(p.expires_at) > now);
    setPosts(active);
    // Find next expiring non-pinned post
    const expiring = active
      .filter((p: any) => !p.pinned)
      .sort((a: any, b: any) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
    setNextExpiry(expiring[0]?.expires_at || null);
  };

  useEffect(() => { if (siteId) load(); }, [siteId]);

  const post = async () => {
    if (!text.trim() || !user) return;

    if (pinMode) {
      // Add pin payment to cart — post after payment
      addToCart({ id: `pin_${siteId}_${Date.now()}`, label: 'Post fixado por 365 dias', price: 10, type: 'plan' });
      toast.success('$10 USDC adicionado ao carrinho. Após pagamento seu post será fixado!');
      openCart();
      return;
    }

    setPosting(true);
    const { error } = await supabase.from('feed_posts' as any).insert({
      site_id: siteId,
      user_id: user.id,
      text: text.trim(),
      pinned: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (error) { toast.error(error.message); }
    else { toast.success('Publicado! Visível por 7 dias.'); setText(''); load(); }
    setPosting(false);
  };

  const deletePost = async (id: string) => {
    await supabase.from('feed_posts' as any).delete().eq('id', id).eq('user_id', user!.id);
    setPosts(p => p.filter((x: any) => x.id !== id));
  };

  const pinnedPosts = posts.filter((p: any) => p.pinned);
  const regularPosts = posts.filter((p: any) => !p.pinned);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Composer */}
      {isOwner && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: 18,
          padding: 16, border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <textarea value={text} onChange={e => setText(e.target.value)}
            style={{
              width: '100%', background: 'transparent', color: 'var(--tb-text,#fff)',
              fontSize: 14, resize: 'none' as const, outline: 'none',
              fontFamily: 'var(--tb-font,system-ui)', lineHeight: 1.6,
              border: 'none', boxSizing: 'border-box' as const,
            }}
            rows={3} placeholder="O que está acontecendo?" maxLength={500} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: '"Courier New",monospace' }}>
                {text.length}/500
              </span>
              <button onClick={() => setPinMode(!pinMode)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                  background: pinMode ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                  color: pinMode ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                  transition: 'all .15s',
                }}>
                <Pin style={{ width: 11, height: 11 }} />
                {pinMode ? 'Fixar por $10 USDC (365 dias)' : 'Fixar?'}
              </button>
            </div>
            <button onClick={post} disabled={!text.trim() || posting}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, color: '#fff',
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                opacity: !text.trim() || posting ? 0.5 : 1,
                transition: 'all .15s',
              }}>
              <Send style={{ width: 13, height: 13 }} />
              {posting ? 'Publicando...' : pinMode ? 'Fixar ($10)' : 'Publicar (7 dias)'}
            </button>
          </div>
        </div>
      )}

      {/* Pinned posts — on top, amber border */}
      {pinnedPosts.map((post: any) => (
        <PostCard key={post.id} post={post} isOwner={isOwner} onDelete={deletePost} accentColor={accentColor} />
      ))}

      {/* Regular posts with countdown */}
      {regularPosts.map((post: any) => (
        <PostCard key={post.id} post={post} isOwner={isOwner} onDelete={deletePost} accentColor={accentColor} />
      ))}

      {posts.length === 0 && !isOwner && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          Nenhum post ainda
        </div>
      )}
    </div>
  );
}

function PostCard({ post, isOwner, onDelete, accentColor }: {
  post: any; isOwner: boolean; onDelete: (id: string) => void; accentColor: string;
}) {
  const isPinned = post.pinned;
  const isExpiringSoon = !isPinned && (new Date(post.expires_at).getTime() - Date.now()) < 3600000;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${isPinned ? 'rgba(245,158,11,0.35)' : isExpiringSoon ? 'rgba(255,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 16,
      padding: 16,
      position: 'relative',
    }}>
      {/* Pinned badge */}
      {isPinned && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <Pin style={{ width: 11, height: 11, color: '#f59e0b' }} />
          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>FIXADO</span>
        </div>
      )}

      {/* Post text */}
      <p style={{ color: 'var(--tb-text,#fff)', fontSize: 15, lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>
        {post.text}
      </p>

      {/* Post image */}
      {post.image_url && (
        <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 12, marginTop: 10, objectFit: 'cover', maxHeight: 300 }} />
      )}

      {/* Footer: time (left) + countdown bottom-left + delete (right) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Left side: ago + countdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock style={{ width: 11, height: 11 }} />
            {timeAgo(post.created_at)}
          </span>
          {/* Countdown — phosphor green, bottom-left */}
          {!isPinned && (
            <Countdown expiresAt={post.expires_at} size="sm" showDays />
          )}
          {isPinned && post.pinned_until && (
            <span style={{ fontSize: 10, color: '#f59e0b', fontFamily: '"Courier New",monospace', fontWeight: 700 }}>
              📌 até {new Date(post.pinned_until).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
        {isOwner && (
          <button onClick={() => onDelete(post.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,100,100,0.5)', padding: 4, display: 'flex', alignSelf: 'flex-start' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#ff6464'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,100,100,0.5)'}>
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>
    </div>
  );
}
