'use client';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { WindowFeed } from '@/components/layout/WindowFeed';
import { JackpotBanner } from '@/components/ui/JackpotBanner';
import { Footer } from '@/components/layout/Footer';
import { Crown, Play, Home, Car, FileText, Zap, Globe, ArrowRight, Coins, Shield, Lock, TrendingUp, Users } from 'lucide-react';

const FEATURES = [
  { icon: Globe,      title: 'Mini Site',        desc: 'Your personal page with links, bio, videos, CV and carousel. Works on slug.trustbank.xyz' },
  { icon: Crown,      title: 'Slug Marketplace', desc: 'Claim your name. Short slugs like /ceo or /art are premium digital assets.' },
  { icon: Play,       title: 'YouTube Paywall',  desc: 'Set a USDC price for your videos. Fans pay to watch. Split goes straight to your wallet.' },
  { icon: Home,       title: 'Properties',       desc: 'List real estate with 10-photo carousel. Reach global buyers for $1/month.' },
  { icon: Car,        title: 'Cars',             desc: 'Sell vehicles with full specs, photos and direct contact. $1/month listing fee.' },
  { icon: FileText,   title: 'CV Unlock',        desc: 'Companies pay USDC to unlock your contact info. You earn 60%. Directory = platform keeps it.' },
  { icon: Zap,        title: 'Boost',            desc: 'Anyone can boost your profile, videos or listings. $0.50 = +1 position. 7 days at the top.' },
  { icon: Coins,      title: 'Credits',          desc: 'Buy USDC credits once, spend them across the platform. Withdraw anytime to your wallet.' },
];

const STATS = [
  { value: 'USDC', label: 'Polygon · No banks' },
  { value: '60%',  label: 'Revenue to creator' },
  { value: '30',   label: 'Premium themes' },
  { value: '14',   label: 'Languages' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Header />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-semibold mb-6 border border-brand/20">
          <Coins className="w-3 h-3" /> USDC payments · Polygon · No banks
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-[var(--text)] leading-tight mb-6">
          Your identity.<br />
          <span className="text-brand">Your brand.</span>
        </h1>
        <p className="text-xl text-[var(--text2)] max-w-2xl mx-auto mb-10">
          Create a beautiful mini site, claim your slug, monetize YouTube videos with USDC paywall, and list properties or cars.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/auth" className="btn-primary px-8 py-3.5 text-base flex items-center gap-2">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/slugs" className="btn-secondary px-8 py-3.5 text-base">
            Browse Slugs
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-2xl font-black text-brand">{s.value}</p>
              <p className="text-xs text-[var(--text2)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Jackpot banner */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <JackpotBanner />
      </div>

      {/* Live feed */}
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[var(--text)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              Live Activity
            </h2>
            <p className="text-sm text-[var(--text2)]">Posts, mini sites, properties and videos from the community</p>
          </div>
          <Link href="/slugs" className="text-xs text-brand font-semibold hover:underline flex items-center gap-1">
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="max-w-5xl mx-auto px-4 overflow-hidden">
          <WindowFeed />
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-black text-[var(--text)] text-center mb-3">Everything in one place</h2>
        <p className="text-[var(--text2)] text-center mb-12">One profile. Multiple revenue streams. All paid in USDC.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card p-5 hover:border-brand/40 transition-all hover:-translate-y-0.5 duration-200">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-black text-[var(--text)] mb-1 text-sm">{f.title}</h3>
                <p className="text-xs text-[var(--text2)] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <div className="card p-10" style={{ background: 'linear-gradient(135deg, var(--bg2), var(--card))' }}>
          <h2 className="text-3xl font-black text-[var(--text)] mb-3">Start earning in USDC today</h2>
          <p className="text-[var(--text2)] mb-6">Free to create. No credit card. No bank account needed.</p>
          <Link href="/auth" className="btn-primary px-10 py-3.5 text-base inline-flex items-center gap-2">
            Create your mini site free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
