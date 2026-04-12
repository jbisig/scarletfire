import { injectOgTags } from '../../_lib/injectOgTags.js';
import { WEB_ORIGIN } from '../../_lib/constants.js';
import { INDEX_HTML } from '../../_lib/indexHtml.js';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'nodejs' };

function clampBg(bg: string | null): number {
  const n = Number(bg);
  if (!Number.isFinite(n)) return 1;
  const rounded = Math.round(n);
  if (rounded < 1) return 1;
  if (rounded > 6) return 6;
  return rounded;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const username = decodeURIComponent(url.searchParams.get('username') ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  if (!username) {
    return new Response(INDEX_HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('display_name, is_public')
    .eq('username', username.toLowerCase())
    .single();

  if (error || !profile || !profile.is_public) {
    return new Response(INDEX_HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  }

  const displayName = profile.display_name || username;
  const title = `${displayName}'s Favorites — Scarlet Fire`;
  const description = `Check out ${displayName}'s favorite Grateful Dead shows and songs on Scarlet Fire`;
  const imageUrl = `${WEB_ORIGIN}/api/og/profile/${encodeURIComponent(username)}?bg=${bgIndex}`;
  const shareUrl = `${WEB_ORIGIN}/profile/${encodeURIComponent(username)}`;

  const injected = injectOgTags(INDEX_HTML, { title, description, imageUrl, url: shareUrl });

  return new Response(injected, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
