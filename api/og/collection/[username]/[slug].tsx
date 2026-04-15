import { ImageResponse } from '@vercel/og';
import { renderCard } from '../../../_lib/ogTemplate.js';
import { WEB_ORIGIN } from '../../../_lib/constants.js';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const fontUrl = `${WEB_ORIGIN}/share/FamiljenGrotesk-SemiBold.ttf`;

async function loadFont(): Promise<ArrayBuffer> {
  const res = await fetch(fontUrl);
  return res.arrayBuffer();
}

function clampBg(bg: string | null): number {
  const n = Number(bg);
  if (!Number.isFinite(n)) return 1;
  const rounded = Math.round(n);
  if (rounded < 1) return 1;
  if (rounded > 6) return 6;
  return rounded;
}

export default async function handler(req: Request): Promise<Response> {
  const rawReq = req as any;
  const host = rawReq.headers?.host ?? rawReq.headers?.get?.('host') ?? 'www.scarletfire.app';
  const url = new URL(rawReq.url, `https://${host}`);
  const username = decodeURIComponent(url.searchParams.get('username') ?? '');
  const slug = decodeURIComponent(url.searchParams.get('slug') ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [fontData, profileResult] = await Promise.all([
    loadFont(),
    supabase
      .from('profiles')
      .select('id, is_public')
      .eq('username', username.toLowerCase())
      .single(),
  ]);

  const fonts = [{ name: 'FamiljenGrotesk', data: fontData, weight: 500 as const }];

  if (profileResult.error || !profileResult.data || !profileResult.data.is_public) {
    return new ImageResponse(
      renderCard({ title: 'Scarlet Fire', subtitle: 'Grateful Dead Archive', tier: null, bgIndex }),
      { width: 1200, height: 1200, fonts, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } }
    );
  }

  const { data: collection } = await supabase
    .from('collections')
    .select('name, type, collection_items(count)')
    .eq('user_id', profileResult.data.id)
    .eq('slug', slug)
    .single();

  if (!collection) {
    return new ImageResponse(
      renderCard({ title: 'Scarlet Fire', subtitle: 'Grateful Dead Archive', tier: null, bgIndex }),
      { width: 1200, height: 1200, fonts, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } }
    );
  }

  const itemCount = (collection as any).collection_items?.[0]?.count ?? 0;
  const noun = collection.type === 'playlist' ? 'tracks' : 'shows';

  return new ImageResponse(
    renderCard({
      title: collection.name,
      subtitle: `${itemCount} ${noun} · @${username}`,
      tier: null,
      bgIndex,
    }),
    {
      width: 1200,
      height: 1200,
      fonts,
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    }
  );
}
