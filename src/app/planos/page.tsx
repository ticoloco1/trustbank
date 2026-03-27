'use client';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useCart } from '@/store/cart';
import { Check, Zap, Crown, Building2 } from 'lucide-react';

const PLANS = [
  {
    id: 'pro', name: 'Pro', icon: Crown, monthly: 29.90, annual: 239.90,
    features: ['Unlimited mini sites', '1 free slug (7+ chars)', 'Unlimited links', 'YouTube paywall', 'Unlockable CV', 'Properties & Cars listings', 'Analytics', 'No watermark'],
    popular: true,
  },
  {
    id: 'business', name: 'Business', icon: Building2, monthly: 99.90, annual: 799.90,
    features: ['Everything in Pro', '10 premium slugs included', 'Custom domain', 'Multi-site admin', 'API access', 'Priority support', 'White label'],
  },
];

export default function PlanosPage() {
  const [annual, setAnnual] = useState(false);
  const { add } = useCart();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-[var(--text)] mb-3">Plans & Pricing</h1>
          <p className="text-[var(--text2)] mb-6">Simple, transparent pricing</p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-semibold ${!annual ? 'text-[var(--text)]' : 'text-[var(--text2)]'}`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${annual ? 'bg-brand' : 'bg-[var(--border)]'}`}>
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${annual ? 'left-8' : 'left-1'}`} />
            </button>
            <span className={`text-sm font-semibold ${annual ? 'text-[var(--text)]' : 'text-[var(--text2)]'}`}>
              Annual <span className="text-green-500 text-xs">save 33%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const price = annual ? plan.annual : plan.monthly;
            return (
              <div key={plan.id} className={`card p-8 flex flex-col ${plan.popular ? 'border-brand ring-2 ring-brand/20' : ''}`}>
                {plan.popular && (
                  <div className="text-center mb-4">
                    <span className="bg-brand text-white text-xs font-black px-4 py-1 rounded-full">MOST POPULAR</span>
                  </div>
                )}
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-brand" />
                </div>
                <h2 className="text-2xl font-black text-[var(--text)] mb-1">{plan.name}</h2>
                <div className="mb-1">
                  <span className="text-4xl font-black text-[var(--text)]">${price.toFixed(2)}</span>
                  <span className="text-[var(--text2)] text-sm ml-1">{annual ? '/year' : '/month'}</span>
                </div>
                {annual && (
                  <p className="text-green-500 text-xs mb-4">
                    Save ${((plan.monthly * 12) - plan.annual).toFixed(0)} vs monthly
                  </p>
                )}
                <ul className="space-y-2 flex-1 my-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[var(--text)]">
                      <Check className="w-4 h-4 text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => add({
                    id: `plan_${plan.id}_${annual ? 'annual' : 'monthly'}`,
                    label: `${plan.name} Plan (${annual ? 'Annual' : 'Monthly'})`,
                    price,
                    type: 'plan',
                  })}
                  className={`w-full py-3 rounded-xl font-black text-sm transition-all ${
                    plan.popular ? 'btn-primary' : 'btn-secondary'
                  }`}>
                  Get Started
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
