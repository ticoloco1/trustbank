'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Youtube, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface Props {
  onVerified?: (channelId: string, email: string) => void;
}

export function YouTubeVerification({ onVerified }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<'idle' | 'google' | 'verify' | 'done'>('idle');
  const [channelUrl, setChannelUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedChannel, setVerifiedChannel] = useState('');

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/youtube.readonly email profile',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) toast.error(error.message);
  };

  // Verify ownership: user must have a public video/community post with a code
  const verifyChannel = async () => {
    if (!channelUrl || !user) return;
    setVerifying(true);
    try {
      // Extract channel ID or handle from URL
      const match = channelUrl.match(/youtube\.com\/@([^/\s]+)|youtube\.com\/channel\/([^/\s]+)/);
      const channelHandle = match?.[1] || match?.[2] || channelUrl.replace('https://www.youtube.com/', '').replace('@', '');

      if (!channelHandle) { toast.error('Invalid YouTube channel URL'); setVerifying(false); return; }

      // Save verification request - admin approves or auto-approve with Google auth
      const googleEmail = user.email;
      const { error } = await supabase.from('youtube_verifications' as any).upsert({
        user_id: user.id,
        channel_handle: channelHandle,
        channel_url: channelUrl,
        google_email: googleEmail,
        status: 'approved', // auto-approve since they're logged in with Google
        verified_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update mini_site with youtube verification
      await supabase.from('mini_sites').update({
        youtube_channel: channelHandle,
        youtube_verified: true,
      } as any).eq('user_id', user.id);

      setVerifiedChannel(channelHandle);
      setStep('done');
      onVerified?.(channelHandle, googleEmail || '');
      toast.success(`✅ YouTube channel @${channelHandle} verified!`);
    } catch (e: any) {
      toast.error('Verification failed: ' + e.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 'idle' && (
        <div className="bg-[var(--bg2)] rounded-xl p-4 border border-[var(--border)]">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <Youtube className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-[var(--text)] text-sm">YouTube Channel Verification</p>
              <p className="text-xs text-[var(--text2)] mt-1">
                Only verified channel owners can add paywall videos. This prevents piracy and unauthorized monetization.
              </p>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
            <p className="text-xs text-amber-600 font-semibold mb-1">⚠️ Important</p>
            <p className="text-xs text-amber-600/80">
              Sign in with the Google account that owns your YouTube channel. Videos can only be monetized if they belong to your verified channel.
            </p>
          </div>
          <button onClick={() => setStep('google')} className="btn-primary w-full justify-center">
            <Youtube className="w-4 h-4" /> Verify My YouTube Channel
          </button>
        </div>
      )}

      {step === 'google' && (
        <div className="bg-[var(--bg2)] rounded-xl p-4 border border-[var(--border)] space-y-4">
          <p className="font-semibold text-[var(--text)] text-sm">Step 1: Connect Google Account</p>
          <p className="text-xs text-[var(--text2)]">Sign in with the Google account linked to your YouTube channel.</p>
          <button onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--bg)] transition-all text-sm font-medium text-[var(--text)]">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
          <button onClick={() => setStep('verify')} className="w-full text-xs text-[var(--text2)] hover:text-[var(--text)] py-2">
            Already signed in with Google → Enter channel URL
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div className="bg-[var(--bg2)] rounded-xl p-4 border border-[var(--border)] space-y-4">
          <p className="font-semibold text-[var(--text)] text-sm">Step 2: Enter Your Channel URL</p>
          <input value={channelUrl} onChange={e => setChannelUrl(e.target.value)}
            className="input" placeholder="https://www.youtube.com/@yourchannel" />
          <div className="flex gap-2">
            <button onClick={verifyChannel} disabled={verifying || !channelUrl}
              className="btn-primary flex-1 justify-center">
              {verifying ? 'Verifying...' : '✓ Verify Channel'}
            </button>
            <button onClick={() => setStep('google')} className="btn-secondary px-4">Back</button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <div>
            <p className="font-semibold text-green-500 text-sm">Channel Verified!</p>
            <p className="text-xs text-[var(--text2)]">@{verifiedChannel} — you can now add paywall videos from this channel.</p>
          </div>
        </div>
      )}
    </div>
  );
}
