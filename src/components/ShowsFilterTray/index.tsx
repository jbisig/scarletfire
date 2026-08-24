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
import { useResponsive } from '../../hooks/useResponsive';
import { TagCategorySection } from './TagCategorySection';
import { YearsSection } from './YearsSection';
import { FilterActionBar } from './FilterActionBar';
import {
  ShowsFilterTrayProps,
  ShowsFilterState,
  countSelectedInCategory,
} from './types';
import { TAG_CATEGORIES, tagsInCategory, TagCategoryId, TagId } from '../../constants/tags';
import { getTagCounts, applyTagFilter } from '../../services/tagResolver';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

// 'years' is the Years accordion, which took the removed Era section's top
// slot (era tags were redundant with picking the years directly).
type SectionId = TagCategoryId | 'years';

const DEFAULT_EXPANDED: Record<SectionId, boolean> = {
  years: true,
  era: false,
  source: true,
  venueType: false,
  instrumentation: false,
  notable: false,
};

// Stable empty result for the closed-tray fast path — see `counts` below.
const EMPTY_COUNTS = {} as Record<TagId, number>;

export function ShowsFilterTray({
  isOpen,
  onClose,
  appliedFilters,
  onApply,
  showsByYear,
}: ShowsFilterTrayProps) {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();

  // Local pending state (not applied until user clicks Apply)
  const [pendingTags, setPendingTags] = useState<TagId[]>(appliedFilters.selectedTags);
  const [pendingYears, setPendingYears] = useState<string[]>(appliedFilters.selectedYears);
  const [expandedCategories, setExpandedCategories] = useState<Record<SectionId, boolean>>(DEFAULT_EXPANDED);

  // Reset pending state when tray opens with new applied filters
  useEffect(() => {
    if (isOpen) {
      setPendingTags(appliedFilters.selectedTags);
      setPendingYears(appliedFilters.selectedYears);
    }
  }, [isOpen, appliedFilters]);

  // Toggle a tag selection
  const handleToggleTag = useCallback((id: TagId) => {
    setPendingTags(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  }, []);

  const toggleExpanded = useCallback((category: SectionId) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  }, []);

  // Toggle a year selection
  const handleToggleYear = useCallback((year: string) => {
    setPendingYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  }, []);

  // Select all years in an era
  const handleSelectAllInEra = useCallback((years: string[]) => {
    const enabledYears = showsByYear ? years.filter(y => (showsByYear[y]?.length ?? 0) > 0) : years;
    const allSelected = enabledYears.length > 0 && enabledYears.every(y => pendingYears.includes(y));

    if (allSelected) {
      // Deselect all years in this era
      setPendingYears(prev => prev.filter(y => !enabledYears.includes(y)));
    } else {
      // Select all enabled years in this era
      setPendingYears(prev => [...new Set([...prev, ...enabledYears])]);
    }
  }, [pendingYears, showsByYear]);

  // Reset all filters and apply immediately (keep tray open)
  const handleReset = useCallback(() => {
    const emptyFilters: ShowsFilterState = {
      selectedYears: [],
      selectedTags: [],
    };
    setPendingTags([]);
    setPendingYears([]);
    onApply(emptyFilters);
  }, [onApply]);

  // Apply filters and close
  const handleApply = useCallback(() => {
    const newFilters: ShowsFilterState = {
      selectedYears: pendingYears,
      selectedTags: pendingTags,
    };
    onApply(newFilters);
    onClose();
  }, [pendingTags, pendingYears, onApply, onClose]);

  // All show dates, and those narrowed to the pending year selection
  const allDates = useMemo(
    () => (showsByYear ? Object.values(showsByYear).flat().map(s => s.date.slice(0, 10)) : []),
    [showsByYear]
  );
  const yearDates = useMemo(
    () => (pendingYears.length ? allDates.filter(d => pendingYears.includes(d.slice(0, 4))) : allDates),
    [allDates, pendingYears]
  );

  // Faceted counts for each tag, given the current pending selections.
  // The tray is always mounted (with isOpen=false) so Home can animate it
  // open instantly; gate on isOpen so a closed tray never pays for walking
  // the full tag index during Home's first paint. The open-effect above
  // re-seeds pendingTags/pendingYears whenever the tray opens, so this
  // recomputes with fresh inputs as soon as isOpen flips true.
  const counts = useMemo(
    () => (isOpen ? getTagCounts(pendingTags, yearDates) : EMPTY_COUNTS),
    [isOpen, pendingTags, yearDates]
  );

  // Compute matching show count (same isOpen gate as `counts` above)
  const matchingShowCount = useMemo(
    () => (isOpen ? applyTagFilter(yearDates, pendingTags).length : 0),
    [isOpen, yearDates, pendingTags]
  );

  // The centered dialog is a desktop pattern; under the desktop breakpoint
  // web gets the same fullscreen tray as native so the mobile layout is one
  // layout, not two.
  const isWeb = Platform.OS === 'web' && isDesktop;

  const content = (
    <View style={[styles.container, !isWeb && { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Filter Shows</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.closeText}>Cancel</Text>
          <Ionicons name="close" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <YearsSection
          selectedYears={pendingYears}
          showsByYear={showsByYear}
          expanded={expandedCategories.years}
          onToggleExpanded={() => toggleExpanded('years')}
          onToggleYear={handleToggleYear}
          onSelectAllInEra={handleSelectAllInEra}
        />

        {/* Era tags are gone from the tray — the Years accordion above covers
            the same ground with direct year picks. */}
        {TAG_CATEGORIES.filter(category => category.id !== 'era').map(category => (
          <TagCategorySection
            key={category.id}
            category={category}
            tags={tagsInCategory(category.id)}
            selected={pendingTags}
            counts={counts}
            expanded={
              expandedCategories[category.id] ||
              countSelectedInCategory({ selectedYears: pendingYears, selectedTags: pendingTags }, category.id) > 0
            }
            onToggleExpanded={() => toggleExpanded(category.id)}
            onToggleTag={handleToggleTag}
          />
        ))}
      </ScrollView>

      {/* Bottom Action Bar */}
      <FilterActionBar
        matchingCount={matchingShowCount}
        onReset={handleReset}
        onApply={handleApply}
      />
    </View>
  );

  if (isWeb) {
    return (
      <Modal
        visible={isOpen}
        animationType="fade"
        transparent
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.webOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.webModal}>
                {content}
              </View>
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

// Re-export types for convenience
export * from './types';
