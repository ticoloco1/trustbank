'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface MiniSite {
  id: string;
  user_id: string;
  slug: string;
  site_name: string;
  bio: string;
  avatar_url: string | null;
  banner_url: string | null;
  bg_image_url: string | null;
  theme: string;
  accent_color: string;
  font_size: string;
  photo_shape: string;
  published: boolean;
  show_cv: boolean;
  cv_content: string | null;
  cv_headline: string | null;
  cv_location: string | null;
  cv_skills: string[];
  cv_experience: any[];
  cv_education: any[];
  contact_email: string | null;
  contact_phone: string | null;
  contact_price: number;
  module_order: string[];
  template_id: string;
  text_color: string | null;
  video_cols: number;
  font_style: string;
  photo_size: string;
  cv_locked: boolean;
  cv_free: boolean;
  cv_price: number;
  cv_projects: any[];
  cv_languages: any[];
  cv_certificates: any[];
  cv_contact_whatsapp: string | null;
  cv_hire_price: number;
  cv_hire_currency: string;
  cv_hire_type: string;
  wallet_address: string | null;
  is_verified: boolean;
  section_order: string[];
  updated_at: string;
}

export function useMySite() {
  const { user } = useAuth();
  const [site, setSite] = useState<MiniSite | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('mini_sites')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSite(data as MiniSite | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const save = async (values: Partial<MiniSite>) => {
    if (!user) throw new Error('Not authenticated');

    // Remove user_id from values to avoid conflicts
    const { user_id: _, ...cleanValues } = values as any;

    if (site?.id) {
      const { error } = await supabase
        .from('mini_sites')
        .update({ ...cleanValues, updated_at: new Date().toISOString() })
        .eq('id', site.id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
    } else {
      const slug = (cleanValues.slug || user.email?.split('@')[0] || 'user') +
        user.id.slice(0, 6);
      const { error } = await supabase
        .from('mini_sites')
        .insert({ ...cleanValues, user_id: user.id, slug });
      if (error) throw new Error(error.message);
    }
    await load();
  };

  return { site, loading, save, reload: load };
}

export function usePublicSite(slug: string) {
  const [site, setSite] = useState<MiniSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('mini_sites')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFound(true);
        else setSite(data as MiniSite);
        setLoading(false);
      });
  }, [slug]);

  return { site, loading, notFound };
}
