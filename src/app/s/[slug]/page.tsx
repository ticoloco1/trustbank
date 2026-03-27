'use client';
import { usePublicSite } from '@/hooks/useSite';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/store/cart';
import { toast } from 'sonner';
import { SlugTicker } from '@/components/ui/SlugTicker';
import { EarningsWidget } from '@/components/ui/EarningsWidget';
import { JackpotBanner } from '@/components/ui/JackpotBanner';
import { SecureVideoPlayer } from '@/components/site/SecureVideoPlayer';
import { FeedSection } from '@/components/site/FeedSection';
import { ExternalLink, Lock, Unlock, Share2, Shield, Clock } from 'lucide-react';

// ─── Social brand SVG icons ───────────────────────────────────────────────────
const BRAND: Record<string, { svg: string; color: string }> = {
  instagram: { color:'#E1306C', svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>` },
  youtube:   { color:'#FF0000', svg:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.6 2.8 12 2.8 12 2.8s-4.6 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.3 21.7 12 21.7 12 21.7s4.6 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.2l6.6 3.7-6.6 3.6z"/></svg>` },
  tiktok:    { color:'#00F2EA', svg:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.17a8.16 8.16 0 0 0 4.77 1.52V7.25a4.85 4.85 0 0 1-1-.56z"/></svg>` },
  twitter:   { color:'#1DA1F2', svg:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>` },
  linkedin:  { color:'#0A66C2', svg:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>` },
  spotify:   { color:'#1DB954', svg:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>` },
  github:    { color:'#fff',    svg:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>` },
  whatsapp:  { color:'#25D366', svg:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>` },
  link:      { color:'#94a3b8', svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>` },
};

// ─── 30 Themes ───────────────────────────────────────────────────────────────
const THEMES: Record<string, {
  bg: string; bg2: string; text: string; text2: string; border: string;
  radius: string; font: string; accent: string;
  texture?: string; auroraEffect: boolean;
}> = {
  midnight: { bg:'#0d1117',bg2:'#161b22',text:'#e6edf3',text2:'#8b949e',border:'rgba(240,246,252,0.1)',radius:'14px',font:'"Inter",system-ui',accent:'#818cf8',auroraEffect:false },
  noir:     { bg:'#000',bg2:'#111',text:'#fff',text2:'#666',border:'rgba(255,255,255,0.06)',radius:'8px',font:'"Helvetica Neue",sans-serif',accent:'#fff',auroraEffect:false,texture:'repeating-linear-gradient(0deg,rgba(255,255,255,.015) 0px,rgba(255,255,255,.015) 1px,transparent 1px,transparent 4px)' },
  neon:     { bg:'#0a0015',bg2:'#150025',text:'#fce7f3',text2:'#c084fc',border:'rgba(192,132,252,0.2)',radius:'16px',font:'"Space Grotesk",sans-serif',accent:'#c084fc',auroraEffect:true,texture:'radial-gradient(ellipse at 20% 50%,#6d28d920,transparent 50%),radial-gradient(ellipse at 80% 50%,#be185d20,transparent 50%)' },
  gold:     { bg:'#0c0900',bg2:'#1a1400',text:'#fef3c7',text2:'#d97706',border:'rgba(234,179,8,0.2)',radius:'6px',font:'"Georgia",serif',accent:'#fde68a',auroraEffect:false,texture:'repeating-linear-gradient(90deg,rgba(253,230,138,.03) 0px,rgba(253,230,138,.03) 1px,transparent 1px,transparent 8px)' },
  ocean:    { bg:'#020c18',bg2:'#051e3e',text:'#e0f2fe',text2:'#38bdf8',border:'rgba(56,189,248,0.15)',radius:'12px',font:'system-ui',accent:'#38bdf8',auroraEffect:true,texture:'radial-gradient(ellipse at 50% 100%,#0369a130,transparent 60%)' },
  rose:     { bg:'#1a0010',bg2:'#2a001c',text:'#ffe4e6',text2:'#fb7185',border:'rgba(251,113,133,0.2)',radius:'20px',font:'"Georgia",serif',accent:'#fb7185',auroraEffect:true,texture:'radial-gradient(ellipse at 50% 0%,#9f123a30,transparent 60%)' },
  forest:   { bg:'#0a1a0a',bg2:'#0f2614',text:'#dcfce7',text2:'#4ade80',border:'rgba(74,222,128,0.15)',radius:'12px',font:'system-ui',accent:'#4ade80',auroraEffect:false },
  aurora:   { bg:'#050218',bg2:'#0d1130',text:'#e0e7ff',text2:'#818cf8',border:'rgba(129,140,248,0.2)',radius:'16px',font:'system-ui',accent:'#818cf8',auroraEffect:true,texture:'radial-gradient(ellipse at 20% 30%,#4f46e530,transparent 40%),radial-gradient(ellipse at 80% 70%,#7c3aed25,transparent 40%)' },
  steel:    { bg:'#1a1f2e',bg2:'#232938',text:'#c8d3e0',text2:'#94a3b8',border:'rgba(148,163,184,0.15)',radius:'8px',font:'"IBM Plex Sans",sans-serif',accent:'#94a3b8',auroraEffect:false,texture:'repeating-linear-gradient(92deg,rgba(148,163,184,.06) 0px,rgba(148,163,184,.06) 1px,transparent 1px,transparent 3px)' },
  matrix:   { bg:'#000800',bg2:'#001200',text:'#00ff41',text2:'#00cc33',border:'rgba(0,255,65,0.2)',radius:'4px',font:'"Courier New",monospace',accent:'#00ff41',auroraEffect:false,texture:'repeating-linear-gradient(0deg,rgba(0,255,65,.04) 0px,rgba(0,255,65,.04) 1px,transparent 1px,transparent 20px)' },
  nebula:   { bg:'#0d0520',bg2:'#160830',text:'#f3e8ff',text2:'#a855f7',border:'rgba(168,85,247,0.2)',radius:'16px',font:'system-ui',accent:'#a855f7',auroraEffect:true,texture:'radial-gradient(ellipse at 15% 25%,#7e22ce35,transparent 45%),radial-gradient(ellipse at 85% 75%,#4f46e530,transparent 45%)' },
  ember:    { bg:'#1c0800',bg2:'#2d1000',text:'#ffedd5',text2:'#f97316',border:'rgba(249,115,22,0.2)',radius:'12px',font:'system-ui',accent:'#f97316',auroraEffect:false,texture:'radial-gradient(ellipse at 50% 100%,#9a341440,transparent 60%)' },
  arctic:   { bg:'#0a1628',bg2:'#0f2040',text:'#e0f2fe',text2:'#7dd3fc',border:'rgba(125,211,252,0.15)',radius:'14px',font:'system-ui',accent:'#7dd3fc',auroraEffect:true },
  volcanic: { bg:'#1a0505',bg2:'#2a0808',text:'#fecaca',text2:'#ef4444',border:'rgba(239,68,68,0.2)',radius:'10px',font:'system-ui',accent:'#ef4444',auroraEffect:false,texture:'radial-gradient(ellipse at 50% 100%,#7f1d1d50,transparent 60%)' },
  hex:      { bg:'#0f1923',bg2:'#162030',text:'#e2e8f0',text2:'#06b6d4',border:'rgba(6,182,212,0.15)',radius:'0px',font:'system-ui',accent:'#06b6d4',auroraEffect:false,texture:'repeating-linear-gradient(60deg,rgba(6,182,212,.07) 0px,rgba(6,182,212,.07) 1px,transparent 1px,transparent 28px)' },
  ivory:    { bg:'#fafafa',bg2:'#fff',text:'#18181b',text2:'#71717a',border:'rgba(0,0,0,0.08)',radius:'14px',font:'"DM Sans",sans-serif',accent:'#6366f1',auroraEffect:false },
  editorial:{ bg:'#fffbf5',bg2:'#fff',text:'#1c1917',text2:'#78716c',border:'rgba(0,0,0,0.1)',radius:'4px',font:'"Georgia",serif',accent:'#78716c',auroraEffect:false },
  sky:      { bg:'#f0f9ff',bg2:'#fff',text:'#0c4a6e',text2:'#0369a1',border:'rgba(14,165,233,0.15)',radius:'16px',font:'"DM Sans",sans-serif',accent:'#0ea5e9',auroraEffect:false,texture:'radial-gradient(ellipse at 50% 0%,#bae6fd50,transparent 60%)' },
  mint:     { bg:'#f0fdf4',bg2:'#fff',text:'#14532d',text2:'#16a34a',border:'rgba(22,163,74,0.15)',radius:'14px',font:'system-ui',accent:'#16a34a',auroraEffect:false },
  lavender: { bg:'#faf5ff',bg2:'#fff',text:'#4c1d95',text2:'#7c3aed',border:'rgba(124,58,237,0.15)',radius:'16px',font:'"DM Sans",sans-serif',accent:'#7c3aed',auroraEffect:false,texture:'radial-gradient(ellipse at 50% 0%,#ddd6fe60,transparent 60%)' },
  peach:    { bg:'#fff7ed',bg2:'#fff',text:'#7c2d12',text2:'#ea580c',border:'rgba(234,88,12,0.15)',radius:'14px',font:'system-ui',accent:'#ea580c',auroraEffect:false },
  lemon:    { bg:'#fefce8',bg2:'#fff',text:'#713f12',text2:'#ca8a04',border:'rgba(202,138,4,0.15)',radius:'14px',font:'system-ui',accent:'#ca8a04',auroraEffect:false },
  blush:    { bg:'#fdf2f8',bg2:'#fff',text:'#831843',text2:'#db2777',border:'rgba(219,39,119,0.15)',radius:'20px',font:'"Georgia",serif',accent:'#db2777',auroraEffect:false },
  paper:    { bg:'#faf8f4',bg2:'#f5f2ec',text:'#3d2b1f',text2:'#92400e',border:'rgba(146,64,14,0.12)',radius:'6px',font:'"Georgia",serif',accent:'#92400e',auroraEffect:false,texture:'repeating-linear-gradient(0deg,rgba(180,83,9,.012) 0px,rgba(180,83,9,.012) 1px,transparent 1px,transparent 28px)' },
  geo:      { bg:'#f8fafc',bg2:'#fff',text:'#1e293b',text2:'#475569',border:'rgba(99,102,241,0.12)',radius:'0px',font:'"Space Grotesk",sans-serif',accent:'#6366f1',auroraEffect:false,texture:'repeating-linear-gradient(60deg,rgba(99,102,241,.07) 0px,rgba(99,102,241,.07) 1px,transparent 1px,transparent 60px)' },
  cream:    { bg:'#fdf6e3',bg2:'#fff',text:'#3b2f1e',text2:'#b45309',border:'rgba(180,83,9,0.12)',radius:'10px',font:'system-ui',accent:'#b45309',auroraEffect:false },
  cloud:    { bg:'#f8f9ff',bg2:'#fff',text:'#1e3a5f',text2:'#3b82f6',border:'rgba(59,130,246,0.12)',radius:'18px',font:'"DM Sans",sans-serif',accent:'#3b82f6',auroraEffect:false,texture:'radial-gradient(ellipse at 30% 30%,#dbeafe50,transparent 50%)' },
  sand:     { bg:'#fdf4e7',bg2:'#fff',text:'#44260a',text2:'#d97706',border:'rgba(217,119,6,0.15)',radius:'10px',font:'system-ui',accent:'#d97706',auroraEffect:false },
  nordic:   { bg:'#f5f5f0',bg2:'#fff',text:'#2d2d2a',text2:'#4b7bb5',border:'rgba(75,123,181,0.12)',radius:'6px',font:'system-ui',accent:'#4b7bb5',auroraEffect:false,texture:'repeating-linear-gradient(90deg,rgba(75,123,181,.04) 0px,rgba(75,123,181,.04) 1px,transparent 1px,transparent 40px)' },
  sakura:   { bg:'#fff1f5',bg2:'#fff',text:'#4a1530',text2:'#e11d79',border:'rgba(225,29,121,0.15)',radius:'20px',font:'"Georgia",serif',accent:'#e11d79',auroraEffect:false,texture:'radial-gradient(circle at 20% 30%,#fce7f360,transparent 40%)' },
};

const DEFAULT_THEME = THEMES.midnight;

// ─── Countdown component ──────────────────────────────────────────────────────
function PostCountdown({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setLabel('expired'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      setLabel(d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const urgent = (new Date(expiresAt).getTime() - Date.now()) < 3600000;
  return (
    <span style={{
      fontFamily: '"Courier New",monospace', fontSize: 11, fontWeight: 900,
      color: urgent ? '#ff4444' : '#00ff41',
      textShadow: `0 0 6px ${urgent ? '#ff4444' : '#00ff41'}80`,
      background: '#000', padding: '2px 7px', borderRadius: 4,
      border: `1px solid ${urgent ? '#ff444430' : '#00ff4125'}`,
    }}>⏱ {label}</span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SitePage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const { site, loading, notFound } = usePublicSite(slug);
  const { user } = useAuth();
  const { add: addToCart, open: openCart } = useCart();

  const [links, setLinks] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [cvUnlocked, setCvUnlocked] = useState(false);
  const [shared, setShared] = useState(false);

  const t = (site?.theme && THEMES[site.theme]) ? THEMES[site.theme] : DEFAULT_THEME;
  const accent = site?.accent_color || t.accent || '#818cf8';
  const isOwner = user?.id === site?.user_id;
  const isDark = !['ivory','editorial','sky','mint','lavender','peach','lemon','blush','paper','geo','cream','cloud','sand','nordic','sakura'].includes(site?.theme || '');

  useEffect(() => {
    if (!site?.id) return;
    supabase.from('mini_site_links').select('*').eq('site_id', site.id).order('sort_order').then(r => setLinks(r.data || []));
    supabase.from('mini_site_videos').select('*').eq('site_id', site.id).order('sort_order').then(r => setVideos(r.data || []));
    const now = new Date().toISOString();
    (supabase as any).from('feed_posts').select('*').eq('site_id', site.id)
      .or(`pinned.eq.true,expires_at.gt.${now}`)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20)
      .then((r: any) => setPosts(r.data || []));
    if (user) {
      (supabase as any).from('paywall_unlocks').select('id').eq('user_id', user.id).eq('video_id', site.id).maybeSingle()
        .then(({ data }: any) => { if (data) setCvUnlocked(true); });
    }
  }, [site?.id, user]);

  const handleCvUnlock = () => {
    if (!user) { window.location.href = `/auth?redirect=/${slug}`; return; }
    const price = site?.cv_price || 20;
    addToCart({ id: `cv_unlock_${site!.id}`, label: `CV: ${site!.site_name}`, price, type: 'plan' });
    openCart();
  };

  const handleShare = () => {
    navigator.share?.({ title: site?.site_name, url: window.location.href })
      .catch(() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); });
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0d1117' }}>
      <div style={{ width:40, height:40, border:'3px solid #818cf8', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Not found ──
  if (notFound) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0d1117', flexDirection:'column', gap:16 }}>
      <p style={{ fontSize:64 }}>🔍</p>
      <h1 style={{ color:'#e6edf3', fontSize:24, fontWeight:900, margin:0 }}>/{slug} not found</h1>
      <p style={{ color:'#8b949e', margin:0 }}>This mini site doesn't exist yet</p>
      <a href="/slugs" style={{ marginTop:8, padding:'10px 24px', borderRadius:12, background:'#818cf8', color:'#fff', fontWeight:700, textDecoration:'none' }}>
        Claim /{slug}
      </a>
    </div>
  );

  if (!site) return null;

  // ── Background styles ──
  const pageBg: React.CSSProperties = {
    minHeight: '100vh',
    background: site.bg_image_url
      ? `url(${site.bg_image_url}) center/cover fixed`
      : t.bg,
    backgroundImage: !site.bg_image_url && t.texture ? t.texture : undefined,
    fontFamily: t.font,
    position: 'relative',
  };

  // ── Content wrapper ──
  const content: React.CSSProperties = {
    maxWidth: 620,
    margin: '0 auto',
    padding: '0 16px 80px',
    position: 'relative',
    zIndex: 1,
  };

  // ── Link button style ──
  const linkBtn = (link: any): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '15px 20px',
    borderRadius: t.radius,
    border: `1px solid ${t.border}`,
    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
    backdropFilter: 'blur(12px)',
    textDecoration: 'none',
    color: t.text,
    fontWeight: 700,
    fontSize: 16,
    transition: 'all 0.15s',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  });

  const brand = (icon: string) => BRAND[icon] || BRAND.link;

  return (
    <div style={pageBg}>
      {/* Aurora glow */}
      {t.auroraEffect && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
          background:`radial-gradient(ellipse at 30% 20%,${accent}25 0%,transparent 50%),radial-gradient(ellipse at 70% 80%,${accent}15 0%,transparent 50%)` }} />
      )}

      {/* Slug ticker */}
      <SlugTicker siteUserId={site.user_id} />

      {/* Banner */}
      {site.banner_url && (
        <div style={{ width:'100%', height:180, overflow:'hidden', position:'relative' }}>
          <img src={site.banner_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 50%, '+t.bg+' 100%)' }} />
        </div>
      )}

      <div style={content}>
        {/* Profile header */}
        <div style={{ textAlign:'center', padding: site.banner_url ? '0 0 32px' : '48px 0 32px' }}>

          {/* Avatar */}
          <div style={{ display:'inline-block', position:'relative', marginBottom:16, marginTop: site.banner_url ? -48 : 0 }}>
            {site.avatar_url ? (
              <img src={site.avatar_url} alt={site.site_name}
                style={{ width:100, height:100, borderRadius: site.photo_shape === 'round' ? '50%' : site.photo_shape === 'square' ? 12 : '24px',
                  objectFit:'cover', border:`3px solid ${accent}`, boxShadow:`0 0 24px ${accent}50` }} />
            ) : (
              <div style={{ width:100, height:100, borderRadius:'50%', background:accent, display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:40, fontWeight:900, color:'#fff', border:`3px solid ${accent}`, boxShadow:`0 0 24px ${accent}50` }}>
                {site.site_name?.[0]?.toUpperCase()}
              </div>
            )}
            {site.is_verified && (
              <Shield style={{ position:'absolute', bottom:-4, right:-4, width:22, height:22, color:'#60a5fa', background:t.bg, borderRadius:'50%', padding:2 }} />
            )}
          </div>

          {/* Name */}
          <h1 style={{ margin:'0 0 6px', fontSize:26, fontWeight:900, color:t.text, letterSpacing:'-0.02em' }}>
            {site.site_name}
          </h1>

          {/* Headline */}
          {site.cv_headline && (
            <p style={{ margin:'0 0 8px', fontSize:15, color:accent, fontWeight:600 }}>{site.cv_headline}</p>
          )}

          {/* Bio */}
          {site.bio && (
            <p style={{ margin:'0 0 16px', fontSize:15, color:t.text2, lineHeight:1.6, maxWidth:420, marginLeft:'auto', marginRight:'auto' }}>
              {site.bio}
            </p>
          )}

          {/* Earnings badge (owner only) */}
          {isOwner && (
            <div style={{ marginBottom:12 }}>
              <EarningsWidget userId={site.user_id} accentColor={accent} compact />
            </div>
          )}

          {/* Share button */}
          <button onClick={handleShare}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:999,
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
              border:`1px solid ${t.border}`, color:t.text2, fontWeight:600, fontSize:13,
              cursor:'pointer', backdropFilter:'blur(8px)' }}>
            <Share2 style={{ width:14, height:14 }} />
            {shared ? 'Copied!' : 'Share'}
          </button>
        </div>

        {/* Jackpot banner */}
        {(site as any).show_jackpot && (
          <div style={{ marginBottom:20 }}>
            <JackpotBanner compact accentColor={accent} />
          </div>
        )}

        {/* Links */}
        {links.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
            {links.map((link: any) => {
              const b = brand(link.icon);
              return (
                <a key={link.id} href={link.url} target="_blank" rel="noopener"
                  style={linkBtn(link)}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 20px ${accent}25`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)'; (e.currentTarget as HTMLAnchorElement).style.transform = ''; (e.currentTarget as HTMLAnchorElement).style.boxShadow = ''; }}>
                  {/* Brand icon */}
                  <span style={{ width:28, height:28, color:b.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                    dangerouslySetInnerHTML={{ __html: b.svg }} />
                  {/* Title */}
                  <span style={{ flex:1, textAlign:'center', fontSize:16, fontWeight:700, color:t.text }}>{link.title}</span>
                  {/* Arrow */}
                  <ExternalLink style={{ width:16, height:16, color:t.text2, flexShrink:0, opacity:0.5 }} />
                </a>
              );
            })}
          </div>
        )}

        {/* CV */}
        {site.show_cv && (
          <div style={{ marginBottom:24 }}>
            {(site.cv_locked && !cvUnlocked) ? (
              <div style={{ padding:'20px 24px', borderRadius:t.radius, border:`1px solid ${accent}40`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <Lock style={{ width:16, height:16, color:accent }} />
                    <span style={{ fontWeight:800, color:t.text, fontSize:16 }}>Currículo / CV</span>
                  </div>
                  {site.cv_headline && <p style={{ color:t.text2, fontSize:13, margin:0 }}>{site.cv_headline}</p>}
                </div>
                <button onClick={handleCvUnlock}
                  style={{ padding:'10px 18px', borderRadius:999, background:accent, color:'#fff',
                    fontWeight:800, fontSize:13, border:'none', cursor:'pointer', whiteSpace:'nowrap',
                    boxShadow:`0 4px 16px ${accent}50` }}>
                  Desbloquear · ${site.cv_price || 20} USDC
                </button>
              </div>
            ) : (
              <div style={{ padding:'20px 24px', borderRadius:t.radius, border:`1px solid ${t.border}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <Unlock style={{ width:16, height:16, color:'#22c55e' }} />
                  <span style={{ fontWeight:800, color:t.text, fontSize:16 }}>Currículo / CV</span>
                  <span style={{ fontSize:11, color:'#22c55e', fontWeight:700, padding:'2px 8px', borderRadius:999, background:'rgba(34,197,94,0.1)' }}>Desbloqueado</span>
                </div>
                {site.cv_content && (
                  <div style={{ color:t.text2, fontSize:14, lineHeight:1.7, whiteSpace:'pre-wrap' }}>{site.cv_content}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <h2 style={{ color:t.text, fontSize:17, fontWeight:800, margin:'0 0 12px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:24, height:24, borderRadius:6, background:'#ff0000', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                <svg viewBox="0 0 24 24" fill="#fff" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>
              </span>
              Videos
            </h2>
            <div style={{ display:'grid', gridTemplateColumns: videos.length === 1 ? '1fr' : 'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
              {videos.map((v: any) => (
                <div key={v.id} style={{ borderRadius:t.radius, overflow:'hidden', border:`1px solid ${t.border}` }}>
                  <SecureVideoPlayer
                    videoId={v.id} title={v.title}
                    paywallEnabled={v.paywall_enabled} paywallPrice={v.paywall_price}
                    accentColor={accent} siteSlug={slug} />
                  {v.title && (
                    <div style={{ padding:'10px 14px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                      <p style={{ margin:0, fontWeight:700, fontSize:14, color:t.text }}>{v.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feed posts */}
        {posts.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <h2 style={{ color:t.text, fontSize:17, fontWeight:800, margin:'0 0 12px' }}>Posts</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {posts.map((p: any) => (
                <div key={p.id} style={{ padding:'16px 18px', borderRadius:t.radius,
                  border:`1px solid ${p.pinned ? accent+'50' : t.border}`,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                  {p.pinned && (
                    <p style={{ color:accent, fontSize:11, fontWeight:800, margin:'0 0 6px', display:'flex', alignItems:'center', gap:4 }}>
                      📌 FIXADO
                    </p>
                  )}
                  <p style={{ margin:0, color:t.text, fontSize:15, lineHeight:1.65, whiteSpace:'pre-wrap' }}>{p.text}</p>
                  {p.image_url && <img src={p.image_url} style={{ width:'100%', borderRadius:10, marginTop:10, objectFit:'cover', maxHeight:300 }} />}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10 }}>
                    <span style={{ fontSize:11, color:t.text2, display:'flex', alignItems:'center', gap:4 }}>
                      <Clock style={{ width:11, height:11 }} />
                      {new Date(p.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })}
                    </span>
                    {!p.pinned && p.expires_at && (
                      <PostCountdown expiresAt={p.expires_at} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Owner feed composer */}
        {isOwner && site.id && (
          <div style={{ marginBottom:24 }}>
            <FeedSection siteId={site.id} isOwner={isOwner} accentColor={accent} />
          </div>
        )}

        {/* Powered by */}
        <div style={{ textAlign:'center', paddingTop:24 }}>
          <a href="https://trustbank.xyz" target="_blank" rel="noopener"
            style={{ fontSize:12, color:t.text2, opacity:0.5, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:5 }}>
            <span style={{ width:14, height:14, background:accent, borderRadius:3, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#fff' }}>T</span>
            trustbank.xyz
          </a>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
