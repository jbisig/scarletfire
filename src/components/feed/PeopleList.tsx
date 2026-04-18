import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, SectionList, FlatList, ActivityIndicator, Text, StyleSheet, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SearchBar } from '../SearchBar';
import { PeopleRow } from './PeopleRow';
import { feedService, type PeopleRow as PeopleRowData } from '../../services/feedService';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import type { RootStackParamList } from '../../navigation/AppNavigator';

const PAGE_SIZE = 20;

export function PeopleList() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [following, setFollowing] = useState<PeopleRowData[]>([]);
  const [discover, setDiscover] = useState<PeopleRowData[]>([]);
  const [search, setSearch] = useState<PeopleRowData[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [discoverCursor, setDiscoverCursor] = useState(0);
  const [discoverEnd, setDiscoverEnd] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const load = useCallback(async (refreshing: boolean) => {
    if (refreshing) setIsRefreshing(true); else setIsLoading(true);
    try {
      const result = await feedService.searchProfiles({
        query: debouncedQuery,
        cursor: 0,
        pageSize: PAGE_SIZE,
      });
      setFollowing(result.following);
      setDiscover(result.discover);
      setSearch(result.search);
      setDiscoverCursor(result.discover.length);
      setDiscoverEnd(result.discover.length < PAGE_SIZE);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [debouncedQuery]);

  useEffect(() => { load(false); }, [load]);

  const loadMoreDiscover = useCallback(async () => {
    if (debouncedQuery !== '' || discoverEnd) return;
    const result = await feedService.searchProfiles({
      query: '',
      cursor: discoverCursor,
      pageSize: PAGE_SIZE,
    });
    if (result.discover.length === 0) {
      setDiscoverEnd(true);
      return;
    }
    setDiscover(prev => [...prev, ...result.discover]);
    setDiscoverCursor(c => c + result.discover.length);
    if (result.discover.length < PAGE_SIZE) setDiscoverEnd(true);
  }, [debouncedQuery, discoverCursor, discoverEnd]);

  const handleRowPress = (row: PeopleRowData) => {
    navigation.navigate('PublicProfile', { username: row.username });
  };

  const handleFollowChange = (_rowId: string, _nowFollowing: boolean) => {
    // PR 2 wires optimistic reorder here (M5).
  };

  const renderRow = (row: PeopleRowData) => (
    <PeopleRow
      row={row}
      avatarUrl={row.avatarUrl}
      onPressRow={() => handleRowPress(row)}
      onFollowChange={(f) => handleFollowChange(row.id, f)}
    />
  );

  const header = (
    <View style={styles.searchWrap}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search people..."
        onClear={() => setQuery('')}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View>
        {header}
        <View style={styles.center}><ActivityIndicator color={COLORS.accent} /></View>
      </View>
    );
  }

  if (debouncedQuery !== '') {
    return (
      <View style={{ flex: 1 }}>
        {header}
        {search.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No people found for "{debouncedQuery}"</Text>
          </View>
        ) : (
          <FlatList
            data={search}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => renderRow(item)}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={COLORS.accent} />}
          />
        )}
      </View>
    );
  }

  const sections = [
    ...(following.length > 0 ? [{ title: 'FOLLOWING', data: following }] : []),
    { title: 'DISCOVER', data: discover },
  ];

  return (
    <View style={{ flex: 1 }}>
      {header}
      <SectionList
        sections={sections}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => renderRow(item)}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        onEndReachedThreshold={0.6}
        onEndReached={loadMoreDiscover}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={COLORS.accent} />}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md },
  center: { padding: SPACING.lg, alignItems: 'center' },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '700',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
});
