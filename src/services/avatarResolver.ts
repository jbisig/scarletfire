import { authService } from './authService';

/**
 * Resolve a user's display avatar URL.
 *
 * Prefers `profiles.avatar_url` (covers both OAuth avatars synced at profile
 * creation and custom uploads written by `profileService.uploadAvatar`).
 * Falls back to a Storage `list()` lookup ONLY when `avatar_url` is missing —
 * this covers pre-migration uploaders who had a file in the `avatars` bucket
 * before the `avatar_url` column existed and haven't re-uploaded since.
 *
 * Lives in its own module (rather than `profileService`) because
 * `followService` needs it too, and `profileService` already imports
 * `followService` — importing `profileService` back from `followService`
 * would form a require cycle.
 */
export async function resolveAvatarUrl(
  profile: { id: string; avatar_url?: string | null },
): Promise<string | null> {
  if (profile.avatar_url) return profile.avatar_url;

  const supabase = authService.getClient();
  const { data: files } = await supabase.storage
    .from('avatars')
    .list(profile.id, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
  if (!files || files.length === 0) return null;

  const { data } = supabase.storage.from('avatars').getPublicUrl(`${profile.id}/${files[0].name}`);
  return data.publicUrl || null;
}
