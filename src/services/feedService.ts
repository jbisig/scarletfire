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
    const { data, error } = await supabase.rpc('get_activity_feed', {
      viewer_id: me,
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

    const { data, error } = await supabase.rpc('search_profiles', {
      query_text: args.query,
      viewer_id: me,
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
