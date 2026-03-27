'use client';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Key, Wallet, BarChart3, Settings, Save, CheckCircle, Users, Globe, Play, Crown, Zap, DollarSign, TrendingUp, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

const OWNER_EMAIL = 'arytcfme@gmail.com';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'analytics'|'wallet'|'apis'|'config'>('analytics');
  const [saving, setSaving] = useState(false);
  const [platformWallet, setPlatformWallet] = useState('');
  const [siteUrl, setSiteUrl] = useState('https://trustbank.xyz');
  const [stats, setStats] = useState<any>({});
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.email !== OWNER_EMAIL)) router.push('/');
  }, [user, loading]);

  useEffect(() => {
    if (!user || user.email !== OWNER_EMAIL) return;
    (supabase as any).from('platform_settings').select('key,value').in('key',['platform_wallet','site_url'])
      .then(({ data }: any) => {
        (data||[]).forEach((r:any) => {
          if (r.key==='platform_wallet') setPlatformWallet(r.value||'');
          if (r.key==='site_url') setSiteUrl(r.value||'https://trustbank.xyz');
        });
      });

    Promise.all([
      supabase.from('mini_sites').select('id',{count:'exact',head:true}).eq('published',true),
      supabase.from('mini_sites').select('id',{count:'exact',head:true}),
      (supabase as any).from('classified_listings').select('id',{count:'exact',head:true}).eq('status','active'),
      supabase.from('mini_site_videos').select('id',{count:'exact',head:true}),
      (supabase as any).from('slug_registrations').select('id',{count:'exact',head:true}).eq('status','active'),
      (supabase as any).from('jackpot_pool').select('balance_usdc,total_entries').maybeSingle(),
      (supabase as any).from('boosts').select('amount'),
    ]).then(([pub,tot,list,vid,slug,jack,boosts]:any) => {
      setStats({
        publishedSites: pub.count||0, totalUsers: tot.count||0,
        listings: list.count||0, videos: vid.count||0, slugs: slug.count||0,
        jackpotPool: jack.data?.balance_usdc||0,
        boostRevenue: (boosts.data||[]).reduce((s:number,b:any)=>s+(b.amount||0),0),
        tickets: jack.data?.total_entries||0,
      });
      setLoadingStats(false);
    });
  }, [user]);

  const save = async () => {
    setSaving(true);
    await (supabase as any).from('platform_settings').upsert([
      {key:'platform_wallet',value:platformWallet},
      {key:'site_url',value:siteUrl},
    ],{onConflict:'key'});
    toast.success('Saved! Also update env vars in Vercel.');
    setSaving(false);
  };

  const copy = (t:string) => { navigator.clipboard.writeText(t); toast.success('Copied!'); };

  if (loading) return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand"/></div>;
  if (!user || user.email !== OWNER_EMAIL) return null;

  const STATS_GRID = [
    {icon:Globe, label:'Published sites', val:stats.publishedSites},
    {icon:Users, label:'Total accounts', val:stats.totalUsers},
    {icon:Crown, label:'Active slugs', val:stats.slugs},
    {icon:Play,  label:'Videos', val:stats.videos},
    {icon:Zap,   label:'Boost revenue', val:stats.boostRevenue!=null?`$${stats.boostRevenue.toFixed(2)}`:'—'},
    {icon:DollarSign, label:'Jackpot pool', val:stats.jackpotPool!=null?`$${stats.jackpotPool.toFixed(2)}`:'—'},
    {icon:TrendingUp, label:'Jackpot tickets', val:stats.tickets?.toLocaleString()},
    {icon:Globe, label:'Active listings', val:stats.listings},
  ];

  const ENV_VARS = [
    {name:'NEXT_PUBLIC_SUPABASE_URL', desc:'Project URL (app.supabase.com → Settings → API)', required:true},
    {name:'NEXT_PUBLIC_SUPABASE_ANON_KEY', desc:'Anon public key (Supabase → Settings → API)', required:true},
    {name:'SUPABASE_SERVICE_ROLE_KEY', desc:'Service role key — NEVER expose client-side', required:true},
    {name:'NEXT_PUBLIC_HELIO_API_KEY', desc:'API key (hel.io → Developer → API Keys)', required:true},
    {name:'NEXT_PUBLIC_PLATFORM_WALLET', desc:'Your Polygon 0x address — receives all platform revenue', required:true},
    {name:'NEXT_PUBLIC_SITE_URL', desc:'https://trustbank.xyz', required:true},
    {name:'NEXT_PUBLIC_COINBASE_APP_ID', desc:'Optional — Coinbase Pay for credit card users', required:false},
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header/>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-[var(--text)] mb-1">Admin Panel</h1>
        <p className="text-[var(--text2)] text-sm mb-8">{user.email}</p>

        <div className="flex gap-1.5 mb-8 border-b border-[var(--border)] overflow-x-auto">
          {[['analytics','Analytics',BarChart3],['wallet','Wallet',Wallet],['apis','API Keys',Key],['config','Config',Settings]].map(([id,label,Icon]:any)=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all -mb-px ${tab===id?'border-brand text-brand':'border-transparent text-[var(--text2)] hover:text-[var(--text)]'}`}>
              <Icon className="w-4 h-4"/>{label}
            </button>
          ))}
        </div>

        {tab==='analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STATS_GRID.map(s=>(
                <div key={s.label} className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <s.icon className="w-5 h-5 text-brand"/>
                  </div>
                  <div>
                    <p className="text-xl font-black text-[var(--text)]">{loadingStats?'...':s.val??0}</p>
                    <p className="text-xs text-[var(--text2)]">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-[var(--text)] mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[['/governance','Governance'],['/slugs','Slugs'],['/jackpot','Jackpot'],['/cv','CV Directory']].map(([href,label])=>(
                  <a key={href} href={href} className="btn-secondary text-center text-sm py-2">{label} →</a>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==='wallet' && (
          <div className="space-y-5">
            <div className="card p-6">
              <h3 className="font-black text-[var(--text)] mb-2 flex items-center gap-2"><Wallet className="w-5 h-5 text-brand"/>Platform Wallet (Polygon USDC)</h3>
              <p className="text-sm text-[var(--text2)] mb-4">All platform revenue routes here on-chain via Helio split payments. Jackpot pool (20% of boosts) is tracked in DB but funds land here too.</p>
              <div className="flex gap-2">
                <input value={platformWallet} onChange={e=>setPlatformWallet(e.target.value)} className="input flex-1 font-mono text-sm" placeholder="0x..."/>
                <button onClick={()=>copy(platformWallet)} className="btn-secondary px-3"><Copy className="w-4 h-4"/></button>
              </div>
              <div className="mt-4 space-y-2 text-xs">
                {[
                  ['Boost (80%)', 'Direct to platform wallet on-chain'],
                  ['Jackpot pool (20%)', 'Same wallet, tracked separately in DB'],
                  ['Video paywall (40%)', 'Platform share from Helio split'],
                  ['Subscription (100%)', 'Full amount to platform'],
                  ['Slug renewal (100%)', 'Full amount to platform'],
                ].map(([src,note])=>(
                  <div key={src} className="flex items-center gap-3 p-2 bg-[var(--bg2)] rounded-lg">
                    <span className="font-semibold text-brand w-40">{src}</span>
                    <span className="text-[var(--text2)]">{note}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-black text-[var(--text)] mb-3">Revenue Splits</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-[var(--text2)] border-b border-[var(--border)]"><th className="text-left py-2">Type</th><th className="text-right py-2 text-green-400">Creator</th><th className="text-right py-2 text-brand">Platform</th><th className="text-right py-2 text-amber-400">Jackpot</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {[
                      ['Video paywall','60%','40%','—'],
                      ['CV (direct)','50%','50%','—'],
                      ['CV (directory)','0%','100%','—'],
                      ['Slug sale','90%','10%','—'],
                      ['Boost','0%','80%','20%'],
                      ['Subscription','0%','100%','—'],
                      ['Classified listing','0%','100%','—'],
                    ].map(([t,c,p,j])=>(
                      <tr key={t}><td className="py-2 text-[var(--text)]">{t}</td><td className="py-2 text-right text-green-400">{c}</td><td className="py-2 text-right text-brand">{p}</td><td className="py-2 text-right text-amber-400">{j}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab==='apis' && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-400">
              <strong>Never</strong> store secret keys in the database. Set them only as Vercel environment variables.
              Go to: <strong>vercel.com → trustbank-mjty → Settings → Environment Variables</strong>
            </div>
            {ENV_VARS.map(v=>(
              <div key={v.name} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <code className="text-sm font-mono text-brand">{v.name}</code>
                    <p className="text-xs text-[var(--text2)] mt-1">{v.desc}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${v.required?'bg-red-500/10 text-red-400':'bg-[var(--bg2)] text-[var(--text2)]'}`}>
                    {v.required?'Required':'Optional'}
                  </span>
                </div>
                <button onClick={()=>copy(v.name)} className="mt-2 text-xs text-[var(--text2)] hover:text-brand flex items-center gap-1">
                  <Copy className="w-3 h-3"/> Copy var name
                </button>
              </div>
            ))}
          </div>
        )}

        {tab==='config' && (
          <div className="space-y-5">
            <div className="card p-6 space-y-4">
              <h3 className="font-black text-[var(--text)]">Platform Config</h3>
              <div>
                <label className="label block mb-1">Site URL</label>
                <input value={siteUrl} onChange={e=>setSiteUrl(e.target.value)} className="input" placeholder="https://trustbank.xyz"/>
              </div>
              <div>
                <label className="label block mb-1">Platform Wallet</label>
                <input value={platformWallet} onChange={e=>setPlatformWallet(e.target.value)} className="input font-mono text-sm" placeholder="0x..."/>
              </div>
              <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}
                Save to DB
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
