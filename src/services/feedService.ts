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

export interface GetActivityFeedArgs {
  followingCursor: string | null;
  publicCursor: string | null;
  includeFollowing: boolean;
  includePublic: boolean;
  pageSize: number;
}

export interface GetActivityFeedResult {
  events: ActivityEvent[];
  nextFollowingCursor: string | null;
  nextPublicCursor: string | null;
  followingExhausted: boolean;
  publicExhausted: boolean;
}

class FeedService {
  async getActivityFeed(args: GetActivityFeedArgs): Promise<GetActivityFeedResult> {
    const supabase = authService.getClient();
    const { data: userData } = await supabase.auth.getUser();
    const me = userData?.user?.id;
    if (!me) {
      return {
        events: [],
        nextFollowingCursor: null,
        nextPublicCursor: null,
        followingExhausted: false,
        publicExhausted: false,
      };
    }

    const { data, error } = await supabase.rpc('get_activity_feed', {
      viewer_id: me,
      following_cursor: args.followingCursor,
      public_cursor: args.publicCursor,
      include_following: args.includeFollowing,
      include_public: args.includePublic,
      page_size: args.pageSize,
    });
    if (error) throw error;

    const events = (data ?? []) as ActivityEvent[];

    const followingEvents = events.filter(e => e.source === 'following');
    const publicEvents    = events.filter(e => e.source === 'public');

    const oldest = (list: ActivityEvent[]): string | null =>
      list.length === 0 ? null : list[list.length - 1].created_at;

    // Exhaustion: we asked for rows from this stream (include=true AND cursor was non-null
    // meaning "give me more") but got none. First-page (cursor=null) returning zero isn't
    // exhaustion — it's just empty.
    const followingExhausted =
      args.includeFollowing && args.followingCursor !== null && followingEvents.length === 0;
    const publicExhausted =
      args.includePublic && args.publicCursor !== null && publicEvents.length === 0;

    return {
      events,
      nextFollowingCursor: oldest(followingEvents),
      nextPublicCursor: oldest(publicEvents),
      followingExhausted,
      publicExhausted,
    };
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
