import { authService } from './authService';
import type { ActivityEvent } from './activityService';

export interface PeopleRow {
  id: string;
  username: string;
  display_name: string | null;
  followers_count: number;
  following_count: number;
  viewer_is_following: boolean;
  section: 'following' | 'discover' | 'search';
}

export interface SectionedPeople {
  following: PeopleRow[];
  discover: PeopleRow[];
  search: PeopleRow[];
}

class FeedService {
  async getActivityFeed(args: {
    cursor: string | null;
    pageSize: number;
  }): Promise<ActivityEvent[]> {
    const supabase = authService.getClient();
    const { data: userData } = await supabase.auth.getUser();
    const me = userData?.user?.id;
    if (!me) return [];

    const cursor = args.cursor ?? new Date().toISOString();
    // viewer_id is no longer passed — the RPC derives it from auth.uid()
    // internally (see supabase/migrations/20260706120300_get_activity_feed_auth_uid.sql).
    // `me` above is still used for the early "not signed in" return.
    const { data, error } = await supabase.rpc('get_activity_feed', {
      cursor_time: cursor,
      page_size: args.pageSize,
    });
    if (error) throw error;
    return (data ?? []) as ActivityEvent[];
  }

  async searchProfiles(args: {
    query: string;
    cursor: number;
    pageSize: number;
  }): Promise<SectionedPeople> {
    const supabase = authService.getClient();
    const { data: userData } = await supabase.auth.getUser();
    const me = userData?.user?.id;
    if (!me) return { following: [], discover: [], search: [] };

    // viewer_id is no longer passed — the RPC derives it from auth.uid()
    // internally (see supabase/migrations/20260706120400_search_profiles_auth_uid.sql).
    const { data, error } = await supabase.rpc('search_profiles', {
      query_text: args.query,
      cursor_offset: args.cursor,
      page_size: args.pageSize,
    });
    if (error) throw error;

    const rows = (data ?? []) as PeopleRow[];
    return {
      following: rows.filter(r => r.section === 'following'),
      discover:  rows.filter(r => r.section === 'discover'),
      search:    rows.filter(r => r.section === 'search'),
    };
  }
}

export const feedService = new FeedService();
