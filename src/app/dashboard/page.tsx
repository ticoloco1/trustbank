'use client';
import { useAuth } from '@/hooks/useAuth';
import { useMySite } from '@/hooks/useSite';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { Globe, Edit, Eye, Crown, BarChart3, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { site, loading: siteLoading } = useMySite();
  const router = useRouter();

  if (loading || siteLoading) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) { router.push('/auth'); return null; }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-[var(--text)] mb-2">
          Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-[var(--text2)] mb-10">{user.email}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mini Site Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="font-black text-[var(--text)]">My Mini Site</h2>
                {site?.slug && <p className="text-xs text-[var(--text2)] font-mono">/s/{site.slug}</p>}
              </div>
            </div>
            {site ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${site.published ? 'bg-green-500' : 'bg-amber-400'}`} />
                  <span className="text-sm text-[var(--text2)]">{site.published ? 'Published' : 'Draft'}</span>
                </div>
                <div className="flex gap-2">
                  <Link href="/editor" className="btn-primary flex-1 justify-center py-2">
                    <Edit className="w-4 h-4" /> Edit
                  </Link>
                  <a href={`/s/${site.slug}`} target="_blank" className="btn-secondary flex-1 justify-center py-2">
                    <Eye className="w-4 h-4" /> View
                  </a>
                </div>
              </>
            ) : (
              <Link href="/editor" className="btn-primary w-full justify-center py-2">
                Create Your Site <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Slugs Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="font-black text-[var(--text)]">Slugs</h2>
            </div>
            <p className="text-sm text-[var(--text2)] mb-4">Claim a short, memorable slug for your mini site.</p>
            <Link href="/slugs" className="btn-secondary w-full justify-center py-2">
              Browse Marketplace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Plans Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-500" />
              </div>
              <h2 className="font-black text-[var(--text)]">Plan</h2>
            </div>
            <p className="text-sm text-[var(--text2)] mb-4">Upgrade to Pro to publish your site and unlock all features.</p>
            <Link href="/planos" className="btn-primary w-full justify-center py-2">
              View Plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
