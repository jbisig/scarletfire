/**
 * Filter tray for the Songs index. Same shell and interaction grammar as
 * ShowsFilterTray (pending state, faceted counts, Reset/Apply) but over the
 * four song tag categories and with no Years accordion — years are a show
 * concept; performance-level filtering lives on SongPerformancesScreen.
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/useResponsive';
import { TagCategorySection } from './ShowsFilterTray/TagCategorySection';
import { FilterActionBar } from './ShowsFilterTray/FilterActionBar';
import {
  TAG_CATEGORIES,
  tagsInCategory,
  tagCategory,
  SongTagCategoryId,
  SONG_TAG_CATEGORY_IDS,
  TagId,
} from '../constants/tags';
import { getSongTagCounts, makeSongTagFilter } from '../services/songTagResolver';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface SongsFilterTrayProps {
  isOpen: boolean;
  onClose: () => void;
  appliedTags: TagId[];
  onApply: (tags: TagId[]) => void;
  /** All song titles the filter operates over (the full index). */
  baseTitles: string[];
}

const SONG_CATEGORIES = TAG_CATEGORIES.filter(c => c.appliesTo === 'song');

const DEFAULT_EXPANDED: Record<SongTagCategoryId, boolean> = {
  songType: true,
  songWriters: true,
  songGenre: true,
  songCharacter: true,
};

// Stable empty result for the closed-tray fast path.
const EMPTY_COUNTS = {} as Record<TagId, number>;

export function SongsFilterTray({
  isOpen,
  onClose,
  appliedTags,
  onApply,
  baseTitles,
}: SongsFilterTrayProps) {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();

  // Local pending state (not applied until user clicks Apply)
  const [pendingTags, setPendingTags] = useState<TagId[]>(appliedTags);
  const [expanded, setExpanded] = useState<Record<SongTagCategoryId, boolean>>(DEFAULT_EXPANDED);

  // Reset pending state when tray opens with new applied filters
  useEffect(() => {
    if (isOpen) setPendingTags(appliedTags);
  }, [isOpen, appliedTags]);

  const handleToggleTag = useCallback((id: TagId) => {
    setPendingTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }, []);

  const toggleExpanded = useCallback((category: SongTagCategoryId) => {
    setExpanded(prev => ({ ...prev, [category]: !prev[category] }));
  }, []);

  // Reset and apply immediately (keep tray open) — same behavior as Shows.
  const handleReset = useCallback(() => {
    setPendingTags([]);
    onApply([]);
  }, [onApply]);

  const handleApply = useCallback(() => {
    onApply(pendingTags);
    onClose();
  }, [pendingTags, onApply, onClose]);

  // Faceted counts + matching count, gated on isOpen so a closed (but
  // mounted) tray never walks the catalog. See ShowsFilterTray for rationale.
  const counts = useMemo(
    () => (isOpen ? getSongTagCounts(pendingTags, baseTitles) : EMPTY_COUNTS),
    [isOpen, pendingTags, baseTitles]
  );
  const matchingCount = useMemo(
    () => (isOpen ? baseTitles.filter(makeSongTagFilter(pendingTags)).length : 0),
    [isOpen, baseTitles, pendingTags]
  );

  const selectedInCategory = useCallback(
    (category: SongTagCategoryId) => pendingTags.filter(id => tagCategory(id) === category).length,
    [pendingTags]
  );

  const isWeb = Platform.OS === 'web' && isDesktop;

  const content = (
    <View style={[styles.container, !isWeb && { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Filter Songs</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.closeText}>Cancel</Text>
          <Ionicons name="close" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SONG_CATEGORIES.map(category => (
          <TagCategorySection
            key={category.id}
            category={category}
            tags={tagsInCategory(category.id)}
            selected={pendingTags}
            counts={counts}
            noun="songs"
            expanded={
              expanded[category.id as SongTagCategoryId] ||
              selectedInCategory(category.id as SongTagCategoryId) > 0
            }
            onToggleExpanded={() => toggleExpanded(category.id as SongTagCategoryId)}
            onToggleTag={handleToggleTag}
          />
        ))}
      </ScrollView>

      <FilterActionBar
        matchingCount={matchingCount}
        noun="songs"
        onReset={handleReset}
        onApply={handleApply}
      />
    </View>
  );

  if (isWeb) {
    return (
      <Modal visible={isOpen} animationType="fade" transparent onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.webOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.webModal}>{content}</View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.heading4,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  closeText: {
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.md,
    paddingBottom: 120, // Space for action bar
  },
  webOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webModal: {
    maxWidth: 800,
    width: '90%',
    maxHeight: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
});
