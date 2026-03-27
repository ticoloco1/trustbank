'use client';
import { useAuth } from '@/hooks/useAuth';
import { useMySite } from '@/hooks/useSite';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/store/cart';
import { slugPrice, extractYouTubeId } from '@/lib/utils';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, Eye, Upload, Plus, Trash2, X, Lock, Unlock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { FeedSection } from '@/components/site/FeedSection';
import { PhotoGrid } from '@/components/ui/PhotoGrid';
import { YouTubeVerification } from '@/components/editor/YouTubeVerification';
import { EarningsWidget } from '@/components/ui/EarningsWidget';

// ── 30 Temas Premium — 15 Dark + 15 Light ──────────────────────────────────
const THEMES = [
  { id:'midnight',  label:'Midnight',     emoji:'🌑', bg:'#0d1117', text:'#e6edf3', accent2:'#818cf8', desc:'Dark blue-black',   texture:'' },
  { id:'noir',      label:'Noir',         emoji:'⬛', bg:'#000000', text:'#ffffff', accent2:'#ffffff', desc:'Pure black',        texture:'repeating-linear-gradient(0deg,rgba(255,255,255,.015) 0px,rgba(255,255,255,.015) 1px,transparent 1px,transparent 4px)' },
  { id:'neon',      label:'Neon Tokyo',   emoji:'🌆', bg:'#0a0015', text:'#fce7f3', accent2:'#c084fc', desc:'Synthwave',         texture:'radial-gradient(ellipse at 20% 50%,#6d28d920 0%,transparent 50%),radial-gradient(ellipse at 80% 50%,#be185d20 0%,transparent 50%)' },
  { id:'gold',      label:'Gold',         emoji:'✨', bg:'#0c0900', text:'#fef3c7', accent2:'#fde68a', desc:'Luxury',            texture:'repeating-linear-gradient(90deg,rgba(253,230,138,.03) 0px,rgba(253,230,138,.03) 1px,transparent 1px,transparent 8px)' },
  { id:'ocean',     label:'Ocean',        emoji:'🌊', bg:'#020c18', text:'#e0f2fe', accent2:'#38bdf8', desc:'Deep sea',          texture:'radial-gradient(ellipse at 50% 100%,#0369a130 0%,transparent 60%)' },
  { id:'rose',      label:'Rose',         emoji:'🌹', bg:'#1a0010', text:'#ffe4e6', accent2:'#fb7185', desc:'Editorial pink',    texture:'radial-gradient(ellipse at 50% 0%,#9f123a30 0%,transparent 60%)' },
  { id:'forest',    label:'Forest',       emoji:'🌿', bg:'#0a1a0a', text:'#dcfce7', accent2:'#4ade80', desc:'Organic green',     texture:'radial-gradient(ellipse at 30% 70%,#14532d40 0%,transparent 50%)' },
  { id:'aurora',    label:'Aurora',       emoji:'🌌', bg:'#050218', text:'#e0e7ff', accent2:'#818cf8', desc:'Northern lights',   texture:'radial-gradient(ellipse at 20% 30%,#4f46e530 0%,transparent 40%),radial-gradient(ellipse at 80% 70%,#7c3aed25 0%,transparent 40%)' },
  { id:'steel',     label:'Aço Escovado', emoji:'🔩', bg:'#1a1f2e', text:'#c8d3e0', accent2:'#94a3b8', desc:'Industrial',        texture:'repeating-linear-gradient(92deg,rgba(148,163,184,.06) 0px,rgba(148,163,184,.06) 1px,transparent 1px,transparent 3px)' },
  { id:'matrix',    label:'Matrix',       emoji:'💻', bg:'#000800', text:'#00ff41', accent2:'#00ff41', desc:'Terminal green',    texture:'repeating-linear-gradient(0deg,rgba(0,255,65,.04) 0px,rgba(0,255,65,.04) 1px,transparent 1px,transparent 20px),repeating-linear-gradient(90deg,rgba(0,255,65,.02) 0px,rgba(0,255,65,.02) 1px,transparent 1px,transparent 20px)' },
  { id:'nebula',    label:'Nebulosa',     emoji:'🔮', bg:'#0d0520', text:'#f3e8ff', accent2:'#a855f7', desc:'Purple galaxy',     texture:'radial-gradient(ellipse at 15% 25%,#7e22ce35 0%,transparent 45%),radial-gradient(ellipse at 85% 75%,#4f46e530 0%,transparent 45%)' },
  { id:'ember',     label:'Ember',        emoji:'🔥', bg:'#1c0800', text:'#ffedd5', accent2:'#f97316', desc:'Hot embers',        texture:'radial-gradient(ellipse at 50% 100%,#9a341440 0%,transparent 60%)' },
  { id:'arctic',    label:'Ártico',       emoji:'🧊', bg:'#0a1628', text:'#e0f2fe', accent2:'#7dd3fc', desc:'Ice blue',          texture:'repeating-linear-gradient(135deg,rgba(125,211,252,.04) 0px,rgba(125,211,252,.04) 1px,transparent 1px,transparent 20px)' },
  { id:'volcanic',  label:'Vulcânico',    emoji:'🌋', bg:'#1a0505', text:'#fecaca', accent2:'#ef4444', desc:'Lava dark',         texture:'radial-gradient(ellipse at 50% 100%,#7f1d1d50 0%,transparent 60%),repeating-linear-gradient(45deg,rgba(239,68,68,.03) 0px,rgba(239,68,68,.03) 1px,transparent 1px,transparent 15px)' },
  { id:'hex',       label:'Hexagonal',    emoji:'⬡',  bg:'#0f1923', text:'#e2e8f0', accent2:'#06b6d4', desc:'Cyber grid',        texture:'repeating-linear-gradient(60deg,rgba(6,182,212,.07) 0px,rgba(6,182,212,.07) 1px,transparent 1px,transparent 28px),repeating-linear-gradient(120deg,rgba(6,182,212,.05) 0px,rgba(6,182,212,.05) 1px,transparent 1px,transparent 28px)' },
  { id:'ivory',     label:'Ivory',        emoji:'🤍', bg:'#fafafa', text:'#18181b', accent2:'#6366f1', desc:'Clean minimal',     texture:'' },
  { id:'editorial', label:'Editorial',    emoji:'📰', bg:'#fffbf5', text:'#1c1917', accent2:'#78716c', desc:'Medium style',      texture:'' },
  { id:'sky',       label:'Céu Azul',     emoji:'🩵', bg:'#f0f9ff', text:'#0c4a6e', accent2:'#0ea5e9', desc:'Light blue',        texture:'radial-gradient(ellipse at 50% 0%,#bae6fd50 0%,transparent 60%)' },
  { id:'mint',      label:'Menta',        emoji:'🌱', bg:'#f0fdf4', text:'#14532d', accent2:'#16a34a', desc:'Soft green',        texture:'radial-gradient(ellipse at 80% 20%,#bbf7d040 0%,transparent 50%)' },
  { id:'lavender',  label:'Lavanda',      emoji:'💜', bg:'#faf5ff', text:'#4c1d95', accent2:'#7c3aed', desc:'Lilac',             texture:'radial-gradient(ellipse at 50% 0%,#ddd6fe60 0%,transparent 60%)' },
  { id:'peach',     label:'Pêssego',      emoji:'🍑', bg:'#fff7ed', text:'#7c2d12', accent2:'#ea580c', desc:'Warm orange',       texture:'radial-gradient(ellipse at 20% 80%,#fed7aa40 0%,transparent 50%)' },
  { id:'lemon',     label:'Limão',        emoji:'🍋', bg:'#fefce8', text:'#713f12', accent2:'#ca8a04', desc:'Bright yellow',     texture:'radial-gradient(ellipse at 50% 0%,#fef08a50 0%,transparent 50%)' },
  { id:'blush',     label:'Blush',        emoji:'🌸', bg:'#fdf2f8', text:'#831843', accent2:'#db2777', desc:'Soft rose',         texture:'radial-gradient(ellipse at 80% 20%,#fbcfe840 0%,transparent 50%)' },
  { id:'paper',     label:'Papel',        emoji:'📜', bg:'#faf8f4', text:'#3d2b1f', accent2:'#92400e', desc:'Paper texture',     texture:'repeating-linear-gradient(0deg,rgba(180,83,9,.012) 0px,rgba(180,83,9,.012) 1px,transparent 1px,transparent 28px),repeating-linear-gradient(90deg,rgba(180,83,9,.012) 0px,rgba(180,83,9,.012) 1px,transparent 1px,transparent 28px)' },
  { id:'geo',       label:'Geométrico',   emoji:'📐', bg:'#f8fafc', text:'#1e293b', accent2:'#6366f1', desc:'Abstract art',      texture:'repeating-linear-gradient(60deg,rgba(99,102,241,.07) 0px,rgba(99,102,241,.07) 1px,transparent 1px,transparent 60px),repeating-linear-gradient(120deg,rgba(99,102,241,.05) 0px,rgba(99,102,241,.05) 1px,transparent 1px,transparent 60px)' },
  { id:'cream',     label:'Creme',        emoji:'🧈', bg:'#fdf6e3', text:'#3b2f1e', accent2:'#b45309', desc:'Warm beige',        texture:'repeating-linear-gradient(0deg,rgba(180,83,9,.015) 0px,rgba(180,83,9,.015) 1px,transparent 1px,transparent 24px),repeating-linear-gradient(90deg,rgba(180,83,9,.015) 0px,rgba(180,83,9,.015) 1px,transparent 1px,transparent 24px)' },
  { id:'cloud',     label:'Nuvem',        emoji:'☁️', bg:'#f8f9ff', text:'#1e3a5f', accent2:'#3b82f6', desc:'Soft blue',         texture:'radial-gradient(ellipse at 30% 30%,#dbeafe50 0%,transparent 50%),radial-gradient(ellipse at 70% 70%,#e0e7ff40 0%,transparent 50%)' },
  { id:'sand',      label:'Areia',        emoji:'🏖️', bg:'#fdf4e7', text:'#44260a', accent2:'#d97706', desc:'Golden sand',       texture:'repeating-linear-gradient(30deg,rgba(217,119,6,.02) 0px,rgba(217,119,6,.02) 1px,transparent 1px,transparent 20px)' },
  { id:'nordic',    label:'Nórdico',      emoji:'🇸🇪', bg:'#f5f5f0', text:'#2d2d2a', accent2:'#4b7bb5', desc:'Scandinavian',      texture:'repeating-linear-gradient(90deg,rgba(75,123,181,.04) 0px,rgba(75,123,181,.04) 1px,transparent 1px,transparent 40px),repeating-linear-gradient(0deg,rgba(75,123,181,.04) 0px,rgba(75,123,181,.04) 1px,transparent 1px,transparent 40px)' },
  { id:'sakura',    label:'Sakura',       emoji:'🌺', bg:'#fff1f5', text:'#4a1530', accent2:'#e11d79', desc:'Cherry blossom',    texture:'radial-gradient(circle at 20% 30%,#fce7f360 0%,transparent 40%),radial-gradient(circle at 80% 70%,#fde8f460 0%,transparent 40%)' },
];

const FONT_STYLES = [
  { id: 'sans', label: 'Modern', css: 'font-sans' },
  { id: 'serif', label: 'Elegant', css: 'font-serif' },
  { id: 'mono', label: 'Code', css: 'font-mono' },
];

const ACCENT_PRESETS = [
  '#818cf8','#a78bfa','#f472b6','#34d399','#fbbf24',
  '#60a5fa','#f87171','#22d3ee','#fb923c','#a3e635',
];

export default function EditorPage() {
  const { user, loading: authLoading } = useAuth();
  const { site, loading: siteLoading, save } = useMySite();
  const { add: addToCart } = useCart();
  const router = useRouter();

  const [siteName, setSiteName] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [theme, setTheme] = useState('midnight');
  const [accentColor, setAccentColor] = useState('#818cf8');
  const [fontSize, setFontSize] = useState('md');
  const [fontStyle, setFontStyle] = useState('sans');
  const [photoShape, setPhotoShape] = useState('round');
  const [photoSize, setPhotoSize] = useState('md');
  const [videoCols, setVideoCols] = useState(2);
  const [published, setPublished] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const [showCv, setShowCv] = useState(false);
  const [showFeed, setShowFeed] = useState(true);
  const [showJackpot, setShowJackpot] = useState(false);
  const [cvLocked, setCvLocked] = useState(true);
  const [cvContent, setCvContent] = useState('');
  const [cvHeadline, setCvHeadline] = useState('');
  const [cvLocation, setCvLocation] = useState('');
  const [cvSkills, setCvSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactPrice, setContactPrice] = useState('20');

  const [videos, setVideos] = useState<any[]>([]);
  const [ytUrl, setYtUrl] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  const [paywallEnabled, setPaywallEnabled] = useState(false);
  const [paywallPrice, setPaywallPrice] = useState('0.15');

  const [links, setLinks] = useState<any[]>([]);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Separate classified state for imovel
  const [imoveisEnabled, setImoveisEnabled] = useState(false);
  const [imList, setImList] = useState<any[]>([]);
  const [imTitle, setImTitle] = useState('');
  const [imPrice, setImPrice] = useState('');
  const [imLocation, setImLocation] = useState('');
  const [imDesc, setImDesc] = useState('');
  const [imImages, setImImages] = useState<string[]>([]);
  const [imTipo, setImTipo] = useState('');
  const [imQuartos, setImQuartos] = useState('');
  const [imM2, setImM2] = useState('');
  const [imCurrency, setImCurrency] = useState('BRL');
  const [imContact, setImContact] = useState('');
  const [imLink, setImLink] = useState('');
  const [imContactType, setImContactType] = useState<'phone'|'link'>('phone');
  const [savingIm, setSavingIm] = useState(false);
  const [uploadingIm, setUploadingIm] = useState(false);

  // Separate classified state for carro
  const [carrosEnabled, setCarrosEnabled] = useState(false);
  const [carList, setCarList] = useState<any[]>([]);
  const [carTitle, setCarTitle] = useState('');
  const [carPrice, setCarPrice] = useState('');
  const [carLocation, setCarLocation] = useState('');
  const [carDesc, setCarDesc] = useState('');
  const [carImages, setCarImages] = useState<string[]>([]);
  const [carMarca, setCarMarca] = useState('');
  const [carAno, setCarAno] = useState('');
  const [carKm, setCarKm] = useState('');
  const [carCurrency, setCarCurrency] = useState('BRL');
  const [carContact, setCarContact] = useState('');
  const [carLink, setCarLink] = useState('');
  const [carContactType, setCarContactType] = useState<'phone'|'link'>('phone');
  const [savingCar, setSavingCar] = useState(false);
  const [uploadingCar, setUploadingCar] = useState(false);

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);
  const [ytVerified, setYtVerified] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile'|'appearance'|'cv'|'videos'|'links'|'imoveis'|'carros'|'feed'>('profile');

  useEffect(() => {
    if (!site) return;
    setSiteName(site.site_name || '');
    setSlug(site.slug || '');
    setBio(site.bio || '');
    setAvatarUrl(site.avatar_url || '');
    setBannerUrl(site.banner_url || '');
    setBgImageUrl(site.bg_image_url || '');
    setTheme(site.theme || 'midnight');
    setAccentColor(site.accent_color || '#818cf8');
    setFontSize(site.font_size || 'md');
    setFontStyle((site as any).font_style || 'sans');
    setPhotoShape(site.photo_shape || 'round');
    setPhotoSize((site as any).photo_size || 'md');
    setVideoCols((site as any).video_cols || 2);
    setPublished(site.published || false);
    setWalletAddress((site as any).wallet_address || '');
    setShowCv(site.show_cv || false);
    setShowFeed((site as any).show_feed !== false);
    setShowJackpot((site as any).show_jackpot === true);
    setCvLocked((site as any).cv_locked ?? true);
    setCvContent(site.cv_content || '');
    setCvHeadline(site.cv_headline || '');
    setCvLocation(site.cv_location || '');
    setCvSkills(site.cv_skills || []);
    setContactEmail(site.contact_email || '');
    setContactPhone(site.contact_phone || '');
    setContactPrice(String(site.contact_price || 20));
  }, [site]);

  useEffect(() => {
    if (!site?.id) return;
    supabase.from('mini_site_videos').select('*').eq('site_id', site.id).order('sort_order').then(r => setVideos(r.data || []));
    // Check YouTube verification
    (supabase as any).from('youtube_verifications').select('status').eq('user_id', user!.id).eq('status', 'approved').maybeSingle()
      .then((r: any) => { if (r.data) setYtVerified(true); });
    supabase.from('mini_site_links').select('*').eq('site_id', site.id).order('sort_order').then(r => setLinks(r.data || []));
    (supabase as any).from('classified_listings').select('*').eq('site_id', site.id).eq('type', 'imovel').then((r: any) => setImList(r.data || []));
    (supabase as any).from('classified_listings').select('*').eq('site_id', site.id).eq('type', 'carro').then((r: any) => setCarList(r.data || []));
  }, [site?.id]);

  // ── Autosave 2s after last field change ───────────────────────────────────
  useEffect(() => {
    if (!site?.id || !isDirty.current) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      if (isDirty.current) handleSave(true);
    }, 2000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [siteName, bio, theme, accentColor, fontSize, fontStyle, photoShape, photoSize, videoCols]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  useEffect(() => {
    if (!siteLoading && !site && user) {
      const defaultSlug = (user.email?.split('@')[0] || 'user').replace(/[^a-z0-9]/g, '') + user.id.slice(0, 6);
      save({ site_name: 'My Site', slug: defaultSlug, bio: '', published: false } as any).catch(() => {});
    }
  }, [siteLoading, site, user]);

  const uploadFile = async (file: File, folder: string) => {
    const path = `${user!.id}/${folder}/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
    const { error } = await supabase.storage.from('platform-assets').upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from('platform-assets').getPublicUrl(path).data.publicUrl;
  };

  const handleSave = async (silent = false) => {
    if (!user) return;
    setSaving(true);
    try {
      const currentSlug = site?.slug || slug;
      const sp = slugPrice(slug);
      const slugChanged = slug !== site?.slug;
      await save({
        site_name: siteName, slug: slugChanged && sp === 0 ? slug : currentSlug,
        bio, avatar_url: avatarUrl || null, banner_url: bannerUrl || null,
        bg_image_url: bgImageUrl || null, theme, accent_color: accentColor,
        font_size: fontSize, font_style: fontStyle, photo_shape: photoShape,
        photo_size: photoSize, video_cols: videoCols, published,
        show_cv: showCv,
      show_feed: showFeed,
      show_jackpot: showJackpot, cv_locked: cvLocked, cv_content: cvContent,
        cv_headline: cvHeadline, cv_location: cvLocation, cv_skills: cvSkills,
        contact_email: contactEmail, contact_phone: contactPhone,
        contact_price: parseFloat(contactPrice) || 20,
      } as any);
      if (slugChanged && sp > 0) {
        addToCart({ id: `slug_${slug}`, label: `Slug /${slug}`, price: sp, type: 'slug' });
        toast.success(`Slug /${slug} added to cart!`);
      } else {
        isDirty.current = false;
        setLastSaved(new Date());
        if (!silent) toast.success('✅ Site salvo!');
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (published && site?.slug) { window.open(`/s/${site.slug}`, '_blank'); return; }
    await handleSave();
    addToCart({ id: 'plan_pro', label: 'Pro Plan — Publish mini site', price: 29.90, type: 'plan' });
    toast.success('Added to cart! Pay to go live.');
  };

  const addVideo = async () => {
    if (!site?.id || !ytUrl) return;
    if (!ytVerified) { toast.error('Please verify your YouTube channel first'); return; }
    const ytId = extractYouTubeId(ytUrl);
    if (!ytId || ytId.length < 5 || ytId.includes(' ') || ytId.includes('/')) {
      toast.error('Invalid YouTube URL. Use youtube.com/watch?v=... or youtu.be/...');
      return;
    }
    await supabase.from('mini_site_videos').insert({
      site_id: site.id, youtube_video_id: ytId,
      title: ytTitle || 'Video', paywall_enabled: paywallEnabled,
      paywall_price: parseFloat(paywallPrice) || 0.15, sort_order: videos.length,
    });
    toast.success('Video added!');
    setYtUrl(''); setYtTitle('');
    supabase.from('mini_site_videos').select('*').eq('site_id', site.id).order('sort_order').then(r => setVideos(r.data || []));
    // Check YouTube verification
    (supabase as any).from('youtube_verifications').select('status').eq('user_id', user!.id).eq('status', 'approved').maybeSingle()
      .then((r: any) => { if (r.data) setYtVerified(true); });
  };

  const deleteVideo = async (id: string) => {
    await supabase.from('mini_site_videos').delete().eq('id', id);
    setVideos(v => v.filter(x => x.id !== id));
  };

  const addLink = async () => {
    if (!site?.id || !linkTitle || !linkUrl) return;
    await supabase.from('mini_site_links').insert({
      site_id: site.id, user_id: user!.id, title: linkTitle, url: linkUrl, icon: 'link', sort_order: links.length,
    });
    toast.success('Link added!');
    setLinkTitle(''); setLinkUrl('');
    supabase.from('mini_site_links').select('*').eq('site_id', site.id).order('sort_order').then(r => setLinks(r.data || []));
  };

  const deleteLink = async (id: string) => {
    await supabase.from('mini_site_links').delete().eq('id', id);
    setLinks(l => l.filter(x => x.id !== id));
  };

  const uploadImages = async (files: FileList, setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[]): Promise<void> => {
    for (const file of Array.from(files).slice(0, 10 - current.length)) {
      const url = await uploadFile(file, 'classified');
      setter(prev => [...prev, url]);
    }
  };

  const saveClassified = async (type: 'imovel' | 'carro') => {
    const isCar = type === 'carro';
    const title = isCar ? carTitle : imTitle;
    if (!title.trim()) { toast.error('Fill in the title'); return; }
    if (!user) { toast.error('Sign in first'); return; }

    // Auto-save site first if no site.id
    let siteId = site?.id;
    if (!siteId) {
      // Try to save site first
      toast.info('Saving your profile first...');
      try {
        await save({ site_name: siteName || 'My Site', slug: slug || user.id.slice(0,8), bio, published: false } as any);
        siteId = site?.id;
        if (!siteId) { toast.error('Please save your profile first'); return; }
      } catch {
        toast.error('Please save your profile first');
        return;
      }
    }

    isCar ? setSavingCar(true) : setSavingIm(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const payload = {
        site_id: siteId,
        user_id: user.id,
        type,
        title: title.trim(),
        description: (isCar ? carDesc : imDesc) || null,
        price: isCar ? (carPrice ? parseFloat(carPrice) : null) : (imPrice ? parseFloat(imPrice) : null),
        location: (isCar ? carLocation : imLocation) || null,
        images: isCar ? carImages : imImages,
        status: 'active',
        extra: isCar
          ? { marca: carMarca, ano: carAno, km: carKm, currency: carCurrency, contact: carContact, link: carLink, contact_type: carContactType }
          : { tipo: imTipo, quartos: imQuartos, m2: imM2, currency: imCurrency, contact: imContact, link: imLink, contact_type: imContactType },
      };

      // Use REST API directly — most reliable
      const res = await fetch(`${SUPABASE_URL}/rest/v1/classified_listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${session?.access_token || SUPABASE_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = errText;
        try { errMsg = JSON.parse(errText).message || errText; } catch {}
        throw new Error(errMsg);
      }

      toast.success(isCar ? '🚗 Car listed!' : '🏠 Property listed!');
      if (isCar) {
        setCarTitle(''); setCarPrice(''); setCarLocation(''); setCarDesc('');
        setCarImages([]); setCarMarca(''); setCarAno(''); setCarKm('');
        setCarContact(''); setCarLink('');
      } else {
        setImTitle(''); setImPrice(''); setImLocation(''); setImDesc('');
        setImImages([]); setImTipo(''); setImQuartos(''); setImM2('');
        setImContact(''); setImLink('');
      }
      const r = await (supabase as any).from('classified_listings').select('*').eq('site_id', siteId).eq('type', type);
      isCar ? setCarList(r.data || []) : setImList(r.data || []);
    } catch (e: any) {
      console.error('saveClassified error:', e);
      toast.error('Error saving: ' + e.message);
    } finally {
      isCar ? setSavingCar(false) : setSavingIm(false);
    }
  };

  if (authLoading || siteLoading) return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) { router.push('/auth'); return null; }

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];
  const TABS = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'appearance', label: '🎨 Theme' },
    { id: 'cv', label: '📄 CV' },
    { id: 'videos', label: '🎬 Videos' },
    { id: 'links', label: '🔗 Links' },
    { id: 'imoveis', label: '🏠 Properties' },
    { id: 'carros', label: '🚗 Cars' },
    { id: 'feed', label: '📢 Feed' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />

      {/* Editor top bar */}
      <div className="border-b border-[var(--border)] bg-[var(--bg)] sticky top-14 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-brand text-white' : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg2)]'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {site?.slug && (
              <a href={`/s/${site.slug}`} target="_blank" className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Preview
              </a>
            )}
            <button onClick={() => handleSave()} disabled={saving} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={handlePublish}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold text-white flex items-center gap-1.5 ${published ? 'bg-green-600' : 'bg-amber-500'}`}>
              {published ? '🟢 View Site' : '💳 Publish'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="card p-6 space-y-5">
              <h2 className="font-black text-[var(--text)]">Profile</h2>
              <div>
                <label className="label block mb-1">Username (URL)</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text2)]">/s/</span>
                  <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="input flex-1" placeholder="ex: joaosilva" />
                </div>
                {slug && slugPrice(slug) > 0 && <p className="text-xs text-amber-500 mt-1">💎 Premium — ${slugPrice(slug).toLocaleString()} USDC</p>}
              </div>
              <div>
                <label className="label block mb-1">Profile Photo</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--bg2)] border border-[var(--border)]">
                    {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[var(--text2)]">{siteName?.[0] || '?'}</div>}
                  </div>
                  <label className="btn-secondary text-xs cursor-pointer">
                    {uploadingAvatar ? 'Uploading...' : <><Upload className="w-3.5 h-3.5" /> Upload</>}
                    <input type="file" accept="image/*" className="hidden" onChange={async e => { if (e.target.files?.[0]) { setUploadingAvatar(true); try { setAvatarUrl(await uploadFile(e.target.files[0], 'avatars')); } catch(err:any){toast.error(err.message);} setUploadingAvatar(false); }}} />
                  </label>
                </div>
              </div>
              <div>
                <label className="label block mb-1">Banner (full width)</label>
                {bannerUrl ? (
                  <div className="relative">
                    <img src={bannerUrl} alt="" className="w-full h-24 object-cover rounded-xl" />
                    <button onClick={() => setBannerUrl('')} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <label className="btn-secondary text-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Upload Banner
                    <input type="file" accept="image/*" className="hidden" onChange={async e => { if (e.target.files?.[0]) setBannerUrl(await uploadFile(e.target.files[0], 'banners')); }} />
                  </label>
                )}
              </div>
              <div>
                <label className="label block mb-1">Display Name</label>
                <input value={siteName} onChange={e => { setSiteName(e.target.value); isDirty.current = true; }} className="input" placeholder="Your Name" />
              </div>
              <div>
                <label className="label block mb-1">Bio</label>
                <textarea value={bio} onChange={e => { setBio(e.target.value); isDirty.current = true; }} className="input resize-none" rows={3} />
              </div>

              <div className="border-t border-[var(--border)] pt-4">
                <label className="label block mb-1">💳 Wallet Address (Polygon/USDC)</label>
                <input value={walletAddress} onChange={e => setWalletAddress(e.target.value)}
                  className="input font-mono text-xs" placeholder="0x... (to receive USDC payments)" />
                <p className="text-xs text-[var(--text2)] mt-1">
                  Payments from video paywall and CV unlocks go to this address. 
                  You receive <strong>60%</strong>, platform takes 40%.
                </p>
                {walletAddress && (
                  <div className="mt-2 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                    <span className="text-xs text-green-500">✓ Wallet set</span>
                    <a href={`https://polygonscan.com/address/${walletAddress}`} target="_blank"
                      className="text-xs text-brand hover:underline ml-auto">View on Polygonscan →</a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="card p-6 space-y-5">
              <h2 className="font-black text-[var(--text)]">Appearance</h2>
              <div>
                <label className="label block mb-2">Theme</label>
                <div className="grid grid-cols-5 gap-2">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => { setTheme(t.id); isDirty.current = true; }}
                      className={`rounded-xl border-2 transition-all overflow-hidden text-left hover:scale-[1.03] ${theme === t.id ? 'border-brand shadow-lg shadow-brand/20' : 'border-transparent hover:border-[var(--border)]'}`}
                      style={{ background: t.bg }}>
                      {/* Mini preview with texture */}
                      <div style={{ padding: '10px 10px 6px', background: t.bg, backgroundImage: (t as any).texture || undefined, position: 'relative' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: accentColor, marginBottom: 5, boxShadow: `0 0 6px ${accentColor}60` }} />
                        <div style={{ height: 3, borderRadius: 4, background: t.text, opacity: .8, marginBottom: 3, width: '65%' }} />
                        <div style={{ height: 2, borderRadius: 4, background: t.text, opacity: .3, width: '85%', marginBottom: 5 }} />
                        <div style={{ height: 14, borderRadius: 6, background: accentColor, opacity: .85, width: '100%' }} />
                      </div>
                      <div style={{ padding: '4px 8px 7px', background: t.bg, borderTop: `1px solid ${t.text}12` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: t.text }}>{t.emoji} {t.label}</span>
                          {theme === t.id && <span style={{ fontSize: 10, color: accentColor }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 9, color: t.text, opacity: .45, display: 'block', marginTop: 1 }}>{(t as any).desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label block mb-2">Accent Color</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ACCENT_PRESETS.map(c => (
                    <button key={c} onClick={() => setAccentColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${accentColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                  <input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="input w-28 font-mono text-xs" />
                </div>
              </div>
              <div>
                <label className="label block mb-2">Background Image</label>
                {bgImageUrl ? (
                  <div className="relative">
                    <img src={bgImageUrl} alt="" className="w-full h-24 object-cover rounded-xl" />
                    <button onClick={() => setBgImageUrl('')} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <label className="btn-secondary text-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Upload Background
                    <input type="file" accept="image/*" className="hidden" onChange={async e => { if (e.target.files?.[0]) setBgImageUrl(await uploadFile(e.target.files[0], 'bg')); }} />
                  </label>
                )}
              </div>
              <div>
                <label className="label block mb-2">Font Style</label>
                <div className="flex gap-2">
                  {FONT_STYLES.map(f => (
                    <button key={f.id} onClick={() => setFontStyle(f.id)}
                      className={`flex-1 py-2 rounded-xl text-sm border-2 transition-all ${fontStyle === f.id ? 'border-brand text-brand bg-brand/10' : 'border-[var(--border)] text-[var(--text2)]'} ${f.css}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label block mb-2">Font Size</label>
                <div className="flex gap-2">
                  {[{id:'sm',l:'S'},{id:'md',l:'M'},{id:'lg',l:'L'},{id:'xl',l:'XL'}].map(f => (
                    <button key={f.id} onClick={() => setFontSize(f.id)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm border-2 transition-all ${fontSize === f.id ? 'border-brand text-brand bg-brand/10' : 'border-[var(--border)] text-[var(--text2)]'}`}>
                      {f.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label block mb-2">Photo Shape</label>
                <div className="flex gap-2">
                  {['round','square','rounded'].map(s => (
                    <button key={s} onClick={() => setPhotoShape(s)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize border-2 transition-all ${photoShape === s ? 'border-brand text-brand bg-brand/10' : 'border-[var(--border)] text-[var(--text2)]'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label block mb-2">Photo Size</label>
                <div className="flex gap-2">
                  {[{id:'sm',l:'S'},{id:'md',l:'M'},{id:'lg',l:'L'},{id:'xl',l:'XL'}].map(s => (
                    <button key={s.id} onClick={() => setPhotoSize(s.id)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm border-2 transition-all ${photoSize === s.id ? 'border-brand text-brand bg-brand/10' : 'border-[var(--border)] text-[var(--text2)]'}`}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label block mb-2">Video Columns</label>
                <div className="flex gap-2">
                  {[1,2,3].map(n => (
                    <button key={n} onClick={() => setVideoCols(n)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${videoCols === n ? 'border-brand text-brand bg-brand/10' : 'border-[var(--border)] text-[var(--text2)]'}`}>
                      {n} Col{n>1?'s':''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CV */}
          {activeTab === 'cv' && (
            <div className="card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-[var(--text)]">CV / Resume</h2>
                <button onClick={() => setShowCv(!showCv)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${showCv ? 'bg-brand' : 'bg-[var(--border)]'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showCv ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* CV Lock toggle */}
              <div className="flex items-center justify-between bg-[var(--bg2)] rounded-xl p-4 border border-[var(--border)]">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Contact Info Lock</p>
                  <p className="text-xs text-[var(--text2)]">{cvLocked ? 'Visitors must pay to see contact' : 'Contact visible to everyone'}</p>
                </div>
                <button onClick={() => setCvLocked(!cvLocked)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${cvLocked ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-green-500/10 text-green-400 border border-green-500/30'}`}>
                  {cvLocked ? <><Lock className="w-4 h-4" /> Locked</> : <><Unlock className="w-4 h-4" /> Open</>}
                </button>
              </div>

              <div>
                <label className="label block mb-1">Headline</label>
                <input value={cvHeadline} onChange={e => setCvHeadline(e.target.value)} className="input" placeholder="Senior Product Designer" />
              </div>
              <div>
                <label className="label block mb-1">Location</label>
                <input value={cvLocation} onChange={e => setCvLocation(e.target.value)} className="input" placeholder="San Francisco, CA" />
              </div>
              <div>
                <label className="label block mb-1">About</label>
                <textarea value={cvContent} onChange={e => setCvContent(e.target.value)} className="input resize-none" rows={5} placeholder="Write about yourself..." />
              </div>
              <div>
                <label className="label block mb-1">Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {cvSkills.map(s => (
                    <span key={s} className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand/10 text-brand text-xs">
                      {s}<button onClick={() => setCvSkills(cvSkills.filter(x => x !== s))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && newSkill) { setCvSkills([...cvSkills, newSkill]); setNewSkill(''); }}}
                    className="input flex-1" placeholder="Add skill + Enter" />
                  <button onClick={() => { if (newSkill) { setCvSkills([...cvSkills, newSkill]); setNewSkill(''); }}} className="btn-primary px-3"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="border-t border-[var(--border)] pt-4 space-y-3">
                <p className="text-sm font-semibold text-[var(--text)]">Contact Info</p>
                <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="input" placeholder="Email" type="email" />
                <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="input" placeholder="Phone / WhatsApp" />
                <div>
                  <label className="label block mb-1">Unlock Price (USDC)</label>
                  <input value={contactPrice} onChange={e => setContactPrice(e.target.value)} className="input" type="number" min="1" />
                  <p className="text-xs text-[var(--text2)] mt-1">You receive: ${(parseFloat(contactPrice||'0') * 0.5).toFixed(2)} (50%)</p>
                </div>
              </div>
            </div>
          )}

          {/* VIDEOS */}
          {activeTab === 'videos' && (
            <div className="card p-6 space-y-5">
              <h2 className="font-black text-[var(--text)]">Videos</h2>
              {!ytVerified ? (
                <YouTubeVerification onVerified={() => setYtVerified(true)} />
              ) : (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-xs text-green-500 font-semibold">YouTube channel verified — you can add paywall videos</p>
                </div>
              )}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-xs text-amber-600 font-semibold">💡 To protect with paywall: in YouTube Studio set visibility to "Unlisted"</p>
              </div>
              <div className="space-y-3">
                <input value={ytUrl} onChange={e => setYtUrl(e.target.value)} className="input" placeholder="YouTube URL (youtube.com/watch?v=...)" />
                <input value={ytTitle} onChange={e => setYtTitle(e.target.value)} className="input" placeholder="Video title" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPaywallEnabled(!paywallEnabled)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${paywallEnabled ? 'bg-brand' : 'bg-[var(--border)]'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${paywallEnabled ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <span className="text-sm text-[var(--text)]">Paywall</span>
                  </div>
                  {paywallEnabled && <input value={paywallPrice} onChange={e => setPaywallPrice(e.target.value)} className="input w-28 text-xs" placeholder="Price USDC" type="number" step="0.01" />}
                </div>
                <button onClick={addVideo} disabled={!ytUrl || !site?.id || !ytVerified} className="btn-primary w-full justify-center">
                  <Plus className="w-4 h-4" /> Add Video
                </button>
              </div>
              {videos.map(v => (
                <div key={v.id} className="flex items-center gap-3 bg-[var(--bg2)] rounded-xl p-3 border border-[var(--border)]">
                  <img src={`https://img.youtube.com/vi/${v.youtube_video_id}/default.jpg`} alt="" className="w-16 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{v.title}</p>
                    {v.paywall_enabled && <p className="text-xs text-amber-500">${v.paywall_price} USDC</p>}
                  </div>
                  <button onClick={() => deleteVideo(v.id)} className="text-red-400 hover:opacity-70"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}

          {/* LINKS */}
          {activeTab === 'links' && (
            <div className="card p-6 space-y-4">
              <h2 className="font-black text-[var(--text)]">Links & Social</h2>
              <div>
                <label className="label block mb-2">Quick Add</label>
                <div className="flex flex-wrap gap-2">
                  {[{n:'Instagram',p:'https://instagram.com/'},{n:'Twitter/X',p:'https://x.com/'},{n:'YouTube',p:'https://youtube.com/@'},{n:'TikTok',p:'https://tiktok.com/@'},{n:'LinkedIn',p:'https://linkedin.com/in/'},{n:'Spotify',p:'https://open.spotify.com/artist/'},{n:'WhatsApp',p:'https://wa.me/'},{n:'Twitch',p:'https://twitch.tv/'}].map(s => (
                    <button key={s.n} onClick={() => { setLinkTitle(s.n); setLinkUrl(s.p); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] hover:border-brand text-[var(--text2)] hover:text-brand transition-all">
                      {s.n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <input value={linkTitle} onChange={e => setLinkTitle(e.target.value)} className="input" placeholder="Link title" />
                <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="input" placeholder="https://..." type="url" />
                <button onClick={addLink} disabled={!linkTitle || !linkUrl || !site?.id} className="btn-primary w-full justify-center">
                  <Plus className="w-4 h-4" /> Add Link
                </button>
              </div>
              {links.map(link => (
                <div key={link.id} className="flex items-center justify-between bg-[var(--bg2)] rounded-xl px-4 py-3 border border-[var(--border)]">
                  <div><p className="text-sm font-medium text-[var(--text)]">{link.title}</p><p className="text-xs text-[var(--text2)] truncate max-w-xs">{link.url}</p></div>
                  <button onClick={() => deleteLink(link.id)} className="text-red-400 hover:opacity-70"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}

          {/* IMOVEIS */}
          {activeTab === 'imoveis' && (
            <div className="space-y-4">
              <div className="card p-6 space-y-4">
                <h2 className="font-black text-[var(--text)]">🏠 List a Property</h2>
                <div>
                  <label className="label block mb-2">Photos — drag to reorder</label>
                  <PhotoGrid
                    images={imImages}
                    onChange={setImImages}
                    uploading={uploadingIm}
                    onUpload={async (files) => {
                      setUploadingIm(true);
                      await uploadImages(files, setImImages, imImages);
                      setUploadingIm(false);
                    }}
                  />
                </div>
                <input value={imTitle} onChange={e => setImTitle(e.target.value)} className="input" placeholder="Apartment 2BR, House, etc." />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select value={imCurrency} onChange={e => setImCurrency(e.target.value)} className="input mb-2">
                      <option value="BRL">R$ BRL</option><option value="USD">$ USD</option><option value="EUR">€ EUR</option>
                    </select>
                    <input value={imPrice} onChange={e => setImPrice(e.target.value)} className="input" placeholder="Price" type="number" />
                  </div>
                  <input value={imLocation} onChange={e => setImLocation(e.target.value)} className="input" placeholder="Location / Neighborhood" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input value={imTipo} onChange={e => setImTipo(e.target.value)} className="input" placeholder="Type (Apt, House)" />
                  <input value={imQuartos} onChange={e => setImQuartos(e.target.value)} className="input" placeholder="Bedrooms" type="number" />
                  <input value={imM2} onChange={e => setImM2(e.target.value)} className="input" placeholder="Area m²" />
                </div>
                <div>
                  <label className="label block mb-1">Contact Method</label>
                  <div className="flex gap-2 mb-2">
                    {(['phone','link'] as const).map(t => (
                      <button key={t} onClick={() => setImContactType(t)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${imContactType===t?'border-brand text-brand bg-brand/10':'border-[var(--border)] text-[var(--text2)]'}`}>
                        {t === 'phone' ? '📞 Phone/WhatsApp' : '🔗 Link'}
                      </button>
                    ))}
                  </div>
                  {imContactType === 'phone'
                    ? <input value={imContact} onChange={e => setImContact(e.target.value)} className="input" placeholder="+55 11 99999-9999" />
                    : <input value={imLink} onChange={e => setImLink(e.target.value)} className="input" placeholder="https://..." type="url" />
                  }
                </div>
                <textarea value={imDesc} onChange={e => setImDesc(e.target.value)} className="input resize-none" rows={3} placeholder="Description..." />
                <button onClick={() => saveClassified('imovel')} disabled={savingIm || !imTitle.trim()} className="btn-primary w-full justify-center py-3">
                  {savingIm ? 'Saving...' : '🏠 List Property'}
                </button>
              </div>
              {imList.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold text-[var(--text)] mb-3 text-sm">My Properties ({imList.length})</h3>
                  <div className="space-y-2">
                    {imList.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 bg-[var(--bg2)] rounded-xl p-3 border border-[var(--border)]">
                        {item.images?.[0] && <img src={item.images[0]} alt="" className="w-12 h-9 rounded-lg object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text)] truncate">{item.title}</p>
                          {item.price && <p className="text-xs text-brand">R$ {Number(item.price).toLocaleString()}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CARROS */}
          {activeTab === 'carros' && (
            <div className="space-y-4">
              <div className="card p-6 space-y-4">
                <h2 className="font-black text-[var(--text)]">🚗 List a Car</h2>
                <div>
                  <label className="label block mb-2">Photos — drag to reorder</label>
                  <PhotoGrid
                    images={carImages}
                    onChange={setCarImages}
                    uploading={uploadingCar}
                    onUpload={async (files) => {
                      setUploadingCar(true);
                      await uploadImages(files, setCarImages, carImages);
                      setUploadingCar(false);
                    }}
                  />
                </div>
                <input value={carTitle} onChange={e => setCarTitle(e.target.value)} className="input" placeholder="Honda Civic 2022" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select value={carCurrency} onChange={e => setCarCurrency(e.target.value)} className="input mb-2">
                      <option value="BRL">R$ BRL</option><option value="USD">$ USD</option><option value="EUR">€ EUR</option>
                    </select>
                    <input value={carPrice} onChange={e => setCarPrice(e.target.value)} className="input" placeholder="Price" type="number" />
                  </div>
                  <input value={carLocation} onChange={e => setCarLocation(e.target.value)} className="input" placeholder="City / State" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input value={carMarca} onChange={e => setCarMarca(e.target.value)} className="input" placeholder="Brand" />
                  <input value={carAno} onChange={e => setCarAno(e.target.value)} className="input" placeholder="Year" />
                  <input value={carKm} onChange={e => setCarKm(e.target.value)} className="input" placeholder="KM" />
                </div>
                <div>
                  <label className="label block mb-1">Contact Method</label>
                  <div className="flex gap-2 mb-2">
                    {(['phone','link'] as const).map(t => (
                      <button key={t} onClick={() => setCarContactType(t)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${carContactType===t?'border-brand text-brand bg-brand/10':'border-[var(--border)] text-[var(--text2)]'}`}>
                        {t === 'phone' ? '📞 Phone/WhatsApp' : '🔗 Link'}
                      </button>
                    ))}
                  </div>
                  {carContactType === 'phone'
                    ? <input value={carContact} onChange={e => setCarContact(e.target.value)} className="input" placeholder="+55 11 99999-9999" />
                    : <input value={carLink} onChange={e => setCarLink(e.target.value)} className="input" placeholder="https://..." type="url" />
                  }
                </div>
                <textarea value={carDesc} onChange={e => setCarDesc(e.target.value)} className="input resize-none" rows={3} placeholder="Description, extras..." />
                <button onClick={() => saveClassified('carro')} disabled={savingCar || !carTitle.trim()} className="btn-primary w-full justify-center py-3">
                  {savingCar ? 'Saving...' : '🚗 List Car'}
                </button>
              </div>
              {carList.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold text-[var(--text)] mb-3 text-sm">My Cars ({carList.length})</h3>
                  <div className="space-y-2">
                    {carList.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 bg-[var(--bg2)] rounded-xl p-3 border border-[var(--border)]">
                        {item.images?.[0] && <img src={item.images[0]} alt="" className="w-12 h-9 rounded-lg object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text)] truncate">{item.title}</p>
                          {item.price && <p className="text-xs text-brand">R$ {Number(item.price).toLocaleString()}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FEED */}
          {activeTab === 'feed' && site?.id && (
            <div className="card p-6">
              <h2 className="font-black text-[var(--text)] mb-2">Feed</h2>
              <div className="flex items-center justify-between card p-4 mb-3">
                <div>
                  <p className="font-semibold text-sm text-[var(--text)]">Feed no mini site</p>
                  <p className="text-xs text-[var(--text2)]">Mostrar janela de feed 400x448 no seu perfil público</p>
                </div>
                <div className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${showFeed?'bg-brand':'bg-[var(--bg3)]'}`} onClick={()=>{setShowFeed(f=>!f);isDirty.current=true;}}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${showFeed?'translate-x-6':'translate-x-1'}`}/>
                </div>
              </div>
              <div className="flex items-center justify-between card p-4 mb-4">
                <div>
                  <p className="font-semibold text-sm text-[var(--text)]">🎰 Banner do Jackpot</p>
                  <p className="text-xs text-[var(--text2)]">Exibir contador do jackpot no seu mini site</p>
                </div>
                <div className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${showJackpot?'bg-amber-500':'bg-[var(--bg3)]'}`} onClick={()=>{setShowJackpot(j=>!j);isDirty.current=true;}}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${showJackpot?'translate-x-6':'translate-x-1'}`}/>
                </div>
              </div>
              <p className="text-xs text-[var(--text2)] mb-4">Posts expiram em 7 dias. Fixar por 365 dias custa $10 USDC.</p>
              <FeedSection siteId={site.id} isOwner={true} />
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-28">
            <p className="text-xs font-semibold text-[var(--text2)] mb-3 uppercase tracking-wider">Live Preview</p>
            <div className="rounded-2xl overflow-hidden border border-[var(--border)] min-h-[500px]" style={{ background: currentTheme.bg }}>
              {bannerUrl && <img src={bannerUrl} alt="" className="w-full h-20 object-cover" />}
              {!bannerUrl && <div className="h-12 w-full" style={{ background: `${accentColor}20` }} />}
              <div className="p-5">
                <div className="overflow-hidden mb-3 border-4" style={{
                  borderColor: currentTheme.bg,
                  borderRadius: photoShape === 'square' ? '10px' : photoShape === 'rounded' ? '16px' : '50%',
                  width: photoSize === 'xl' ? '96px' : photoSize === 'lg' ? '80px' : '64px',
                  height: photoSize === 'xl' ? '96px' : photoSize === 'lg' ? '80px' : '64px',
                }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-black" style={{ background: accentColor, color: '#fff' }}>{siteName?.[0] || '?'}</div>
                  }
                </div>
                <h3 className="font-black mb-1" style={{ color: currentTheme.text, fontSize: fontSize === 'xl' ? '1.5rem' : fontSize === 'lg' ? '1.25rem' : '1rem' }}>{siteName || 'Your Name'}</h3>
                {bio && <p className="text-xs mb-2 opacity-70" style={{ color: currentTheme.text }}>{bio.slice(0, 60)}</p>}
                {cvHeadline && <p className="text-xs font-semibold mb-3" style={{ color: accentColor }}>{cvHeadline}</p>}
                {links.slice(0, 3).map(l => (
                  <div key={l.id} className="mb-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: `${accentColor}20`, color: currentTheme.text }}>{l.title}</div>
                ))}
              </div>
            </div>
            {site?.slug && <p className="text-center text-xs text-[var(--text2)] mt-2">{site.slug}.trustbank.xyz</p>}
            {user && (
              <div className="mt-3 px-2">
                <EarningsWidget userId={user.id} accentColor={accentColor} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
