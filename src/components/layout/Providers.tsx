'use client';
import '@/lib/i18n';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartModal } from '@/components/ui/CartModal';
import { useTheme } from '@/store/theme';
import { i18n } from '@/lib/i18n';

const queryClient = new QueryClient();

function ThemeSync() {
  const { dark } = useTheme();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return null;
}

function I18nSync() {
  useEffect(() => {
    // Sync i18n language from localStorage on mount
    const saved = localStorage.getItem('i18n-lang');
    if (saved && i18n.language !== saved) {
      i18n.changeLanguage(saved);
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <I18nSync />
      {children}
      <CartModal />
    </QueryClientProvider>
  );
}
