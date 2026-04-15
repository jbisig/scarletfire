import { injectOgTags } from '../../../_lib/injectOgTags.js';
import { WEB_ORIGIN } from '../../../_lib/constants.js';
import { INDEX_HTML } from '../../../_lib/indexHtml.js';
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

function fallback(): Response {
  return new Response(INDEX_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const username = decodeURIComponent(url.searchParams.get('username') ?? '');
  const slug = decodeURIComponent(url.searchParams.get('slug') ?? '');
  const bgIndex = clampBg(url.searchParams.get('bg'));

  if (!username || !slug) return fallback();

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, display_name, is_public')
    .eq('username', username.toLowerCase())
    .single();

  if (profileErr || !profile || !profile.is_public) return fallback();

  const { data: collection, error: collErr } = await supabase
    .from('collections')
    .select('name, type, collection_items(count)')
    .eq('user_id', profile.id)
    .eq('slug', slug)
    .single();

  if (collErr || !collection) return fallback();

  const itemCount = (collection as any).collection_items?.[0]?.count ?? 0;
  const noun = collection.type === 'playlist' ? 'tracks' : 'shows';
  const ownerLabel = profile.display_name || username;
  const title = `${collection.name} — Scarlet Fire`;
  const description = `${collection.name} · ${itemCount} ${noun} by @${username} on Scarlet Fire`;
  const imageUrl = `${WEB_ORIGIN}/api/og/collection/${encodeURIComponent(username)}/${encodeURIComponent(slug)}?bg=${bgIndex}`;
  const shareUrl = `${WEB_ORIGIN}/profile/${encodeURIComponent(username)}/collection/${encodeURIComponent(slug)}`;

  // ownerLabel referenced so TS doesn't flag it; kept available for future tweaks.
  void ownerLabel;

  const injected = injectOgTags(INDEX_HTML, { title, description, imageUrl, url: shareUrl });

  return new Response(injected, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
