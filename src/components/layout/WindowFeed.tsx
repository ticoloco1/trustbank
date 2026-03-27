'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Heart, Share2, ExternalLink, Play, Home, Car, Shield, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Countdown } from '@/components/ui/Countdown';

// ─── Social brand logos as inline SVG ────────────────────────────────────────
const BRAND_ICONS: Record<string, { svg: string; color: string }> = {
  instagram: {
    color: '#E1306C',
    svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>`,
  },
  youtube: {
    color: '#FF0000',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.6 2.8 12 2.8 12 2.8s-4.6 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.3 21.7 12 21.7 12 21.7s4.6 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.2l6.6 3.7-6.6 3.6z"/></svg>`,
  },
  tiktok: {
    color: '#00F2EA',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.17a8.16 8.16 0 0 0 4.77 1.52V7.25a4.85 4.85 0 0 1-1-.56z"/></svg>`,
  },
  twitter: {
    color: '#1DA1F2',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  },
  linkedin: {
    color: '#0A66C2',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  },
  spotify: {
    color: '#1DB954',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`,
  },
  github: {
    color: '#ffffff',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`,
  },
  whatsapp: {
    color: '#25D366',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`,
  },
  link: {
    color: '#94a3b8',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  },
};

function SocialIcon({ type, size = 16 }: { type: string; size?: number }) {
  const brand = BRAND_ICONS[type] || BRAND_ICONS.link;
  return (
    <span
      style={{ color: brand.color, width: size, height: size, display: 'inline-flex', flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: brand.svg }}
    />
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type FeedItem = {
  id: string; kind: 'post' | 'site' | 'classified' | 'video';
  created_at: string; expires_at?: string;
  text?: string; image_url?: string; pinned?: boolean;
  site_name?: string; avatar_url?: string; bio?: string;
  slug?: string; accent_color?: string; is_verified?: boolean;
  title?: string; price?: number; location?: string; images?: string[];
  classified_type?: 'imovel' | 'carro'; extra?: any;
  youtube_video_id?: string; video_title?: string;
  paywall_enabled?: boolean; paywall_price?: number;
  links?: { title: string; url: string; icon: string }[];
};

// ─── Mini carousel ────────────────────────────────────────────────────────────
function MiniCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return null;
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '400/220', overflow: 'hidden', borderRadius: 12, background: '#000', marginTop: 10 }}>
      <img src={images[idx]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {images.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
            style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.65)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />
          </button>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.65)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
          <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
            {images.slice(0, 8).map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                style={{ width: i === idx ? 12 : 6, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.9)', border: 'none', cursor: 'pointer', transition: 'all .15s', padding: 0 }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ item }: { item: FeedItem }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 80 + 5));
  const accent = item.accent_color || '#818cf8';

  return (
    <div style={{ width: 400, minHeight: 448, flexShrink: 0, background: '#12131f', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', scrollSnapAlign: 'start' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px' }}>
        {item.avatar_url
          ? <img src={item.avatar_url} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}40` }} />
          : <div style={{ width: 38, height: 38, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: 16 }}>{item.site_name?.[0] || '?'}</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
            {item.site_name}
            {item.is_verified && <Shield style={{ width: 13, height: 13, color: accent }} />}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
            {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </p>
        </div>
        {item.slug && (
          <a href={`https://${item.slug}.trustbank.xyz`} target="_blank" rel="noopener" style={{ color: 'rgba(255,255,255,.3)', display: 'flex' }}>
            <ExternalLink style={{ width: 14, height: 14 }} />
          </a>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '0 16px 12px', display: 'flex', flexDirection: 'column' }}>
        {item.text && (
          <p style={{ margin: '0 0 10px', color: 'rgba(255,255,255,.88)', fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{item.text}</p>
        )}
        {item.image_url && (
          <div style={{ flex: 1, minHeight: 0, borderRadius: 14, overflow: 'hidden' }}>
            <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        {/* Social links */}
        {item.links && item.links.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {item.links.slice(0, 4).map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', textDecoration: 'none', transition: 'all .15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.09)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.05)'}>
                <SocialIcon type={link.icon} size={18} />
                <span style={{ flex: 1, color: '#fff', fontSize: 13, fontWeight: 600 }}>{link.title}</span>
                <ExternalLink style={{ width: 12, height: 12, color: 'rgba(255,255,255,.3)' }} />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px 14px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <button onClick={() => { setLiked(l => !l); setLikes(n => liked ? n - 1 : n + 1); }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: liked ? '#f43f5e' : 'rgba(255,255,255,.4)', fontSize: 12 }}>
          <Heart style={{ width: 15, height: 15, fill: liked ? '#f43f5e' : 'none' }} /> {likes}
        </button>
        {item.expires_at && !item.pinned && (
          <div style={{ marginLeft: 'auto' }}>
            <Countdown expiresAt={item.expires_at} size="sm" showDays />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Site card ────────────────────────────────────────────────────────────────
function SiteCard({ item }: { item: FeedItem }) {
  const accent = item.accent_color || '#818cf8';
  return (
    <div style={{ width: 400, minHeight: 448, flexShrink: 0, background: '#0d0e1a', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,.06)', position: 'relative', display: 'flex', flexDirection: 'column', scrollSnapAlign: 'start' }}>
      {/* Glow bg */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 30%, ${accent}15 0%, transparent 65%)`, pointerEvents: 'none' }} />
      {/* Banner placeholder */}
      <div style={{ height: 110, background: `linear-gradient(135deg, ${accent}30, ${accent}10)`, flexShrink: 0 }} />
      <div style={{ padding: '0 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {item.avatar_url
          ? <img src={item.avatar_url} style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', border: `3px solid ${accent}60`, marginTop: -36, marginBottom: 10, boxShadow: `0 0 20px ${accent}40` }} />
          : <div style={{ width: 72, height: 72, borderRadius: 16, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', marginTop: -36, marginBottom: 10, boxShadow: `0 0 20px ${accent}40` }}>{item.site_name?.[0] || '?'}</div>
        }
        <p style={{ margin: '0 0 2px', fontWeight: 900, color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
          {item.site_name}
          {item.is_verified && <Shield style={{ width: 15, height: 15, color: accent }} />}
        </p>
        {item.slug && <p style={{ margin: '0 0 10px', fontSize: 12, color: accent, fontFamily: 'monospace' }}>{item.slug}.trustbank.xyz</p>}
        {item.bio && <p style={{ margin: '0 0 auto', color: 'rgba(255,255,255,.55)', fontSize: 13, lineHeight: 1.6, flex: 1 }}>{item.bio}</p>}
        <a href={`https://${item.slug}.trustbank.xyz`} target="_blank" rel="noopener"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, padding: '11px 0', borderRadius: 14, background: accent, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          Ver mini site <ExternalLink style={{ width: 14, height: 14 }} />
        </a>
      </div>
    </div>
  );
}

// ─── Classified card ──────────────────────────────────────────────────────────
function ClassifiedCard({ item }: { item: FeedItem }) {
  const isImovel = item.classified_type === 'imovel';
  return (
    <div style={{ width: 400, minHeight: 448, flexShrink: 0, background: '#0e1019', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', scrollSnapAlign: 'start' }}>
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {item.avatar_url
          ? <img src={item.avatar_url} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{ width: 34, height: 34, borderRadius: '50%', background: isImovel ? '#1d4ed8' : '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isImovel ? <Home style={{ width: 15, height: 15, color: '#fff' }} /> : <Car style={{ width: 15, height: 15, color: '#fff' }} />}
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 13 }}>{item.site_name || 'Anunciante'}</p>
          <p style={{ margin: 0, fontSize: 11, color: isImovel ? '#60a5fa' : '#93c5fd' }}>{isImovel ? '🏠 Imóvel' : '🚗 Veículo'}</p>
        </div>
        {item.price && <span style={{ fontWeight: 900, color: '#4ade80', fontSize: 15 }}>R$ {Number(item.price).toLocaleString('pt-BR')}</span>}
      </div>
      <div style={{ padding: '0 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <MiniCarousel images={item.images || []} />
        <p style={{ margin: '10px 0 4px', color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{item.title}</p>
        {item.location && <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,.4)', fontSize: 12 }}>📍 {item.location}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
          {isImovel ? <>
            {item.extra?.tipo && <span style={{ fontSize: 11, background: '#1d4ed820', color: '#60a5fa', padding: '2px 8px', borderRadius: 999, border: '1px solid #1d4ed840' }}>{item.extra.tipo}</span>}
            {item.extra?.quartos != null && <span style={{ fontSize: 11, background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.6)', padding: '2px 8px', borderRadius: 999 }}>{item.extra.quartos} qtos</span>}
            {item.extra?.m2 != null && <span style={{ fontSize: 11, background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.6)', padding: '2px 8px', borderRadius: 999 }}>{item.extra.m2} m²</span>}
          </> : <>
            {item.extra?.marca && <span style={{ fontSize: 11, background: '#1e40af20', color: '#93c5fd', padding: '2px 8px', borderRadius: 999, border: '1px solid #1e40af40' }}>{item.extra.marca}</span>}
            {item.extra?.ano && <span style={{ fontSize: 11, background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.6)', padding: '2px 8px', borderRadius: 999 }}>{item.extra.ano}</span>}
            {item.extra?.km != null && <span style={{ fontSize: 11, background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.6)', padding: '2px 8px', borderRadius: 999 }}>{Number(item.extra.km).toLocaleString('pt-BR')} km</span>}
          </>}
        </div>
      </div>
      {item.slug && (
        <div style={{ padding: '10px 14px 14px' }}>
          <a href={`https://${item.slug}.trustbank.xyz`} target="_blank" rel="noopener"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
            Ver anúncio completo <ExternalLink style={{ width: 13, height: 13 }} />
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Video card ───────────────────────────────────────────────────────────────
function VideoCard({ item }: { item: FeedItem }) {
  const thumb = item.youtube_video_id ? `https://img.youtube.com/vi/${item.youtube_video_id}/maxresdefault.jpg` : null;
  return (
    <div style={{ width: 400, minHeight: 448, flexShrink: 0, background: '#0d0d0d', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', scrollSnapAlign: 'start' }}>
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {item.avatar_url
          ? <img src={item.avatar_url} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play style={{ width: 15, height: 15, color: '#fff', fill: '#fff' }} />
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 13 }}>{item.site_name}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#f87171' }}>YouTube</p>
        </div>
        {item.paywall_enabled && (
          <span style={{ fontSize: 11, background: 'rgba(245,158,11,.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(245,158,11,.3)', fontWeight: 700 }}>
            🔒 ${item.paywall_price}
          </span>
        )}
      </div>
      <div style={{ flex: 1, margin: '0 14px', borderRadius: 14, overflow: 'hidden', background: '#000', position: 'relative', aspectRatio: '16/9', maxHeight: 220 }}>
        {thumb ? <img src={thumb} alt={item.video_title} style={{ width: '100%', height: '100%', objectFit: 'cover', ...(item.paywall_enabled ? { filter: 'blur(12px) brightness(.35)', transform: 'scale(1.05)' } : {}) }} /> : null}
        {item.paywall_enabled
          ? <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(245,158,11,.2)', border: '1.5px solid rgba(245,158,11,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔒</div>
              <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 13 }}>${item.paywall_price} USDC para assistir</span>
            </div>
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <a href={`https://youtube.com/watch?v=${item.youtube_video_id}`} target="_blank" rel="noopener"
                style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play style={{ width: 22, height: 22, fill: '#fff', color: '#fff', marginLeft: 3 }} />
              </a>
            </div>
        }
      </div>
      <div style={{ padding: '10px 14px 14px' }}>
        <p style={{ margin: 0, color: 'rgba(255,255,255,.85)', fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{item.video_title || 'Sem título'}</p>
      </div>
    </div>
  );
}

// ─── Main WindowFeed ──────────────────────────────────────────────────────────
interface WindowFeedProps {
  siteId?: string;       // if set, shows only posts from this site
  showSocial?: boolean;  // show social links from the site
}

export function WindowFeed({ siteId, showSocial }: WindowFeedProps = {}) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    const from = reset ? 0 : offset;
    const results: FeedItem[] = [];
    const now = new Date().toISOString();

    if (siteId) {
      // Site-specific feed: show only this site's posts, newest first
      const { data: posts } = await supabase
        .from('feed_posts' as any)
        .select('*, mini_sites(slug, site_name, avatar_url, accent_color, is_verified)')
        .eq('site_id', siteId)
        .or(`pinned.eq.true,expires_at.gt.${now}`)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, from + 9);

      // Also load links for social icons
      const { data: links } = await supabase
        .from('mini_site_links')
        .select('*')
        .eq('site_id', siteId)
        .order('sort_order')
        .limit(6);

      (posts || []).forEach((p: any) => results.push({
        id: p.id, kind: 'post', created_at: p.created_at, expires_at: p.expires_at,
        text: p.text, image_url: p.image_url, pinned: p.pinned,
        site_name: p.mini_sites?.site_name, avatar_url: p.mini_sites?.avatar_url,
        slug: p.mini_sites?.slug, is_verified: p.mini_sites?.is_verified,
        accent_color: p.mini_sites?.accent_color,
        links: links || [],
      }));
    } else {
      // Global feed: mix of posts, sites, classifieds, videos
      const [postsRes, sitesRes, classifiedsRes, videosRes] = await Promise.all([
        supabase.from('feed_posts' as any)
          .select('*, mini_sites(slug, site_name, avatar_url, accent_color, is_verified)')
          .or(`pinned.eq.true,expires_at.gt.${now}`)
          .order('created_at', { ascending: false })
          .range(from, from + 3),
        supabase.from('mini_sites')
          .select('id,slug,site_name,bio,avatar_url,accent_color,is_verified,created_at')
          .eq('published', true).order('created_at', { ascending: false }).range(from, from + 1),
        (supabase as any).from('classified_listings')
          .select('*, mini_sites(slug,site_name,avatar_url)')
          .eq('status', 'active').order('created_at', { ascending: false }).range(from, from + 2),
        supabase.from('mini_site_videos')
          .select('*, mini_sites(slug,site_name,avatar_url)')
          .order('created_at', { ascending: false }).range(from, from + 1),
      ]);

      (postsRes.data || []).forEach((p: any) => results.push({
        id: p.id, kind: 'post', created_at: p.created_at, expires_at: p.expires_at,
        text: p.text, image_url: p.image_url, pinned: p.pinned,
        site_name: p.mini_sites?.site_name, avatar_url: p.mini_sites?.avatar_url,
        slug: p.mini_sites?.slug, is_verified: p.mini_sites?.is_verified,
        accent_color: p.mini_sites?.accent_color,
      }));
      (sitesRes.data || []).forEach((s: any) => results.push({ id: s.id, kind: 'site', created_at: s.created_at, ...s }));
      ((classifiedsRes as any).data || []).forEach((c: any) => results.push({ id: c.id, kind: 'classified', created_at: c.created_at, title: c.title, price: c.price, location: c.location, images: c.images, classified_type: c.type, extra: c.extra, site_name: c.mini_sites?.site_name, avatar_url: c.mini_sites?.avatar_url, slug: c.mini_sites?.slug }));
      (videosRes.data || []).forEach((v: any) => results.push({ id: v.id, kind: 'video', created_at: v.created_at, youtube_video_id: v.youtube_video_id, video_title: v.title, paywall_enabled: v.paywall_enabled, paywall_price: v.paywall_price, site_name: v.mini_sites?.site_name, avatar_url: v.mini_sites?.avatar_url, slug: v.mini_sites?.slug }));

      // Sort newest first
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setItems(prev => reset ? results : [...prev, ...results]);
    setHasMore(results.length >= 4);
    setOffset(from + 8);
    setLoading(false);
  }, [offset, siteId]);

  useEffect(() => { load(true); }, [siteId]);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => { if (entries[0].isIntersecting && hasMore && !loading) load(); }, { threshold: 0.1 });
    if (observerRef.current) obs.observe(observerRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, load]);

  return (
    <div style={{ width: '100%' }}>
      <div ref={containerRef}
        style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        className="hide-scrollbar">
        {items.map(item => {
          if (item.kind === 'post') return <PostCard key={item.id} item={item} />;
          if (item.kind === 'site') return <SiteCard key={item.id} item={item} />;
          if (item.kind === 'classified') return <ClassifiedCard key={item.id} item={item} />;
          if (item.kind === 'video') return <VideoCard key={item.id} item={item} />;
          return null;
        })}
        {loading && [...Array(3)].map((_, i) => (
          <div key={i} style={{ width: 400, minHeight: 448, flexShrink: 0, borderRadius: 20, background: 'rgba(255,255,255,.04)', animation: 'pulse 1.5s ease-in-out infinite', scrollSnapAlign: 'start' }} />
        ))}
        <div ref={observerRef} style={{ width: 1, flexShrink: 0 }} />
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
      `}</style>
    </div>
  );
}

export default WindowFeed;
