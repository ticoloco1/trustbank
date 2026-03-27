'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/store/cart';
import { useTheme } from '@/store/theme';
import { ShoppingCart, Sun, Moon, Home, Car, Crown, Pencil, LogOut, Layers, Users, Trophy, Globe, Play } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { SlugTicker } from '@/components/ui/SlugTicker';
import { useTranslation } from 'react-i18next';

export function Header() {
  const { user, signOut } = useAuth();
  const { items, open } = useCart();
  const { dark, toggle } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();

  const NAV = [
    { href: '/imoveis', icon: Home,   label: t('nav.properties') },
    { href: '/carros',  icon: Car,    label: t('nav.cars') },
    { href: '/cv',      icon: Users,  label: 'CVs' },
    { href: '/slugs',   icon: Crown,  label: t('nav.slugs') },
    { href: '/planos',  icon: Layers, label: t('nav.plans') },
    { href: '/sites',   icon: Globe,  label: 'Sites' },
    { href: '/videos',  icon: Play,   label: 'Videos' },
    { href: '/jackpot', icon: Trophy, label: '🎰 Jackpot' },
  ];

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">

          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
              <span className="text-white font-black text-base">T</span>
            </div>
            <span className="font-black text-xl text-[var(--text)] hidden sm:block">TrustBank</span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {NAV.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive(href)
                    ? 'bg-brand/10 text-brand'
                    : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg2)]'
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={toggle}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] hover:border-brand/50 text-[var(--text2)] hover:text-[var(--text)] transition-all text-sm font-medium">
              {dark
                ? <><Sun className="w-4 h-4 text-amber-400" /><span className="hidden lg:block text-xs">Claro</span></>
                : <><Moon className="w-4 h-4 text-indigo-400" /><span className="hidden lg:block text-xs">Escuro</span></>}
            </button>

            <button onClick={open}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] hover:border-brand/50 text-[var(--text2)] hover:text-[var(--text)] transition-all">
              <ShoppingCart className="w-4 h-4" />
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand text-white text-[10px] font-black rounded-full flex items-center justify-center shadow">
                  {items.length}
                </span>
              )}
            </button>

            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/editor"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-brand/30 transition-all hover:opacity-90 hover:shadow-brand/50"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}>
                  <Pencil className="w-4 h-4" />
                  {t('nav.editor')}
                </Link>
                <button onClick={signOut}
                  className="p-2.5 rounded-xl hover:bg-red-500/10 text-[var(--text2)] hover:text-red-400 transition-all border border-[var(--border)]"
                  title="Sair">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/auth"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-brand/30 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}>
                {t('nav.signIn')}
              </Link>
            )}
          </div>
        </div>
      </header>
      <SlugTicker />
    </>
  );
}
