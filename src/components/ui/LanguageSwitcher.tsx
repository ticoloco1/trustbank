'use client';
import '@/lib/i18n';
import { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '@/lib/i18n';
import { ChevronDown, Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(LANGUAGES[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('i18n-lang');
    if (saved) {
      const found = LANGUAGES.find(l => l.code === saved);
      if (found) setCurrent(found);
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changeLang = (lang: typeof LANGUAGES[0]) => {
    setCurrent(lang);
    localStorage.setItem('i18n-lang', lang.code);
    import('@/lib/i18n').then(({ i18n }) => i18n.changeLanguage(lang.code));
    // RTL support for Arabic
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang.code === 'ar' ? 'rtl' : 'ltr';
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] transition-all border border-[var(--border)]">
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:block text-xs font-semibold">{current.code.toUpperCase()}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl z-[300] overflow-hidden"
          style={{ width: 220 }}>
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[var(--text2)]" />
            <span className="text-xs font-bold text-[var(--text2)] uppercase tracking-wide">Idioma</span>
          </div>
          <div className="py-1 max-h-72 overflow-y-auto">
            {LANGUAGES.map(lang => (
              <button key={lang.code} onClick={() => changeLang(lang)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left hover:bg-[var(--bg2)] ${
                  current.code === lang.code ? 'text-brand font-bold bg-brand/5' : 'text-[var(--text)]'
                }`}>
                <span className="text-lg leading-none">{lang.flag}</span>
                <span className="flex-1">{lang.label}</span>
                {current.code === lang.code && <span className="text-brand text-xs font-black">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
