'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/store/cart';
import { Zap, TrendingUp, Crown, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BoostButtonProps {
  targetType: 'site' | 'video' | 'classified';
  targetId: string;
  targetName: string;
  currentScore?: number;
  isTopNow?: boolean; // currently in top position
  compact?: boolean;
}

const PRICE_PER_POSITION = 0.50; // $0.50 USDC per position
const TOP_DAILY_FEE = 50;        // $50/day to stay at top after 7 days
const BOOST_DROP_DAYS = 7;       // stays at top for 7 days
const BOOST_DROP_POSITIONS = 150;// drops 150 positions after 7 days

export function BoostButton({
  targetType, targetId, targetName, currentScore = 0, isTopNow = false, compact = false
}: BoostButtonProps) {
  const { user } = useAuth();
  const { add, open: openCart } = useCart();
  const [open, setOpen] = useState(false);
  const [positions, setPositions] = useState(10);
  const [totalBoosts, setTotalBoosts] = useState(0);
  const [hasSite, setHasSite] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from('boosts' as any)
      .select('amount', { count: 'exact' })
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .then(({ count }) => setTotalBoosts(count || 0));
    // Check if user has published mini site (required for jackpot)
    if (user) {
      supabase.from('mini_sites')
        .select('id')
        .eq('user_id', user.id)
        .eq('published', true)
        .maybeSingle()
        .then(({ data }) => setHasSite(!!data));
    }
  }, [open, targetType, targetId, user]);

  const cost = positions * PRICE_PER_POSITION;

  const handleBoost = () => {
    if (!user) { toast.error('Faça login para boostar'); return; }
    add({
      id: `boost_${targetType}_${targetId}_${Date.now()}`,
      label: `Boost: ${targetName} (+${positions} posições · ${BOOST_DROP_DAYS} dias)`,
      price: cost,
      type: 'boost' as any,
    });
    toast.success(`🚀 Boost de ${positions} posições adicionado! $${cost.toFixed(2)} USDC`);
    openCart();
    setOpen(false);
  };

  const handleTopDaily = () => {
    if (!user) { toast.error('Faça login para manter no topo'); return; }
    add({
      id: `boost_top_${targetId}_${Date.now()}`,
      label: `Top do dia: ${targetName} · $${TOP_DAILY_FEE}/dia`,
      price: TOP_DAILY_FEE,
      type: 'boost' as any,
    });
    toast.success(`⭐ Manter no topo por 1 dia: $${TOP_DAILY_FEE} USDC`);
    openCart();
    setOpen(false);
  };

  if (compact) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition-all"
        style={{ background: 'rgba(99,102,241,.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,.2)' }}
        title="Boostar para subir nas listagens">
        <Zap className="w-3 h-3" /> Boost
        {open && <BoostModal />}
      </button>
    );
  }

  function BoostModal() {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
        <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-lg text-[var(--text)] flex items-center gap-2"><Zap className="w-5 h-5 text-brand" /> Boost</h3>
              <p className="text-xs text-[var(--text2)] truncate max-w-[200px]">{targetName}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-[var(--text2)] hover:text-[var(--text)] transition-colors"><X className="w-5 h-5" /></button>
          </div>

          {/* Current score */}
          <div className="bg-[var(--bg2)] rounded-xl p-4 mb-5 text-center">
            <p className="text-xs text-[var(--text2)] mb-1">Score atual de boost</p>
            <p className="text-3xl font-black text-[var(--text)]">{currentScore.toFixed(0)}</p>
            <p className="text-xs text-[var(--text2)] mt-1">{totalBoosts} boost{totalBoosts !== 1 ? 's' : ''} recebidos</p>
          </div>

          {/* How it works */}
          <div className="space-y-2 mb-5 text-xs text-[var(--text2)]">
            <div className="flex items-start gap-2">
              <span className="text-brand font-bold">$0.50</span>
              <span>= +1 posição nos rankings</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">7 dias</span>
              <span>no top, depois cai 150 posições</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">$50/dia</span>
              <span>para manter no top após cair</span>
            </div>
            <div className="flex items-start gap-2 pt-1 border-t border-[var(--border)]">
              <Zap className="w-3 h-3 text-brand flex-shrink-0 mt-0.5" />
              <span>Qualquer pessoa pode boostar — fãs, amigos, empresas!</span>
            </div>
          </div>

          {/* Jackpot eligibility notice */}
          {user && hasSite === false && (
            <div style={{ background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.3)', borderRadius:10, padding:'8px 12px', marginBottom:12 }}>
              <p style={{ fontSize:11, color:'#fbbf24', fontWeight:600 }}>⚠️ Publique seu mini site para ganhar tickets do jackpot</p>
              <a href="/editor" style={{ fontSize:11, color:'#fbbf24', opacity:.7, textDecoration:'underline' }}>Ir para o editor →</a>
            </div>
          )}
          {user && hasSite === true && (
            <div style={{ background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.2)', borderRadius:10, padding:'8px 12px', marginBottom:12 }}>
              <p style={{ fontSize:11, color:'#4ade80', fontWeight:600 }}>✅ Você participa do jackpot! Cada $0.50 = 1 ticket</p>
            </div>
          )}

          {/* Positions slider */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-[var(--text)]">Posições: <span className="text-brand">+{positions}</span></label>
              <span className="text-sm font-black text-[var(--text)]">${cost.toFixed(2)} USDC</span>
            </div>
            <input type="range" min={1} max={2000} step={1} value={positions}
              onChange={e => setPositions(parseInt(e.target.value))}
              className="w-full accent-brand" />
            <div className="flex justify-between text-xs text-[var(--text2)] mt-1">
              <span>+1 ($0.50)</span>
              <span>+2,000 ($1,000)</span>
            </div>
            {positions >= 1000 && (
              <p className="text-xs text-amber-400 mt-1 text-center">🔥 Com {positions} posições você vai para o topo!</p>
            )}
          </div>

          <button onClick={handleBoost}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white text-sm mb-2 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)' }}>
            <Zap className="w-4 h-4" /> Boostar +{positions} por ${cost.toFixed(2)} USDC
          </button>

          {isTopNow && (
            <button onClick={handleTopDaily}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-amber-400 text-sm transition-all border border-amber-500/30 hover:bg-amber-500/10">
              <Crown className="w-4 h-4" /> Manter no topo hoje · $50 USDC
            </button>
          )}

          <p className="text-[10px] text-center text-[var(--text2)] mt-3">Pago em USDC · Polygon · Qualquer pessoa pode boostar</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
        style={{ background: 'rgba(99,102,241,.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,.2)' }}>
        <Zap className="w-4 h-4" />
        <span>Boost</span>
        {currentScore > 0 && <span className="text-xs opacity-70">·{currentScore.toFixed(0)}</span>}
        <TrendingUp className="w-3.5 h-3.5" />
      </button>
      {open && <BoostModal />}
    </>
  );
}
