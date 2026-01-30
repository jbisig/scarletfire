import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SeriesSection } from './SeriesSection';
import { YearsSection } from './YearsSection';
import { FilterActionBar } from './FilterActionBar';
import {
  ShowsFilterTrayProps,
  ShowsFilterState,
  FilterEra,
  FILTER_ERAS,
} from './types';
import {
  DISPLAY_SERIES,
  getOfficialReleasesForDate,
  expandDisplaySeries,
} from '../../data/officialReleases';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

export function ShowsFilterTray({
  isOpen,
  onClose,
  appliedFilters,
  onApply,
  showsByYear,
}: ShowsFilterTrayProps) {
  const insets = useSafeAreaInsets();

  // Local pending state (not applied until user clicks Apply)
  const [pendingSeries, setPendingSeries] = useState<string[]>(appliedFilters.selectedSeries);
  const [pendingYears, setPendingYears] = useState<string[]>(appliedFilters.selectedYears);

  // Reset pending state when tray opens with new applied filters
  useEffect(() => {
    if (isOpen) {
      setPendingSeries(appliedFilters.selectedSeries);
      setPendingYears(appliedFilters.selectedYears);
    }
  }, [isOpen, appliedFilters]);

  // Toggle a series selection
  const handleToggleSeries = useCallback((series: string) => {
    setPendingSeries(prev =>
      prev.includes(series)
        ? prev.filter(s => s !== series)
        : [...prev, series]
    );
  }, []);

  // Select all series
  const handleSelectAllSeries = useCallback(() => {
    const allSelected = DISPLAY_SERIES.every(s => pendingSeries.includes(s));
    if (allSelected) {
      setPendingSeries([]);
    } else {
      setPendingSeries([...DISPLAY_SERIES]);
    }
  }, [pendingSeries]);

  // Toggle a year selection
  const handleToggleYear = useCallback((year: string) => {
    setPendingYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  }, []);

  // Select all years in an era
  const handleSelectAllInEra = useCallback((era: FilterEra) => {
    // Get enabled years (years with actual shows from selected series)
    let enabledYears: string[];

    if (pendingSeries.length === 0 || !showsByYear) {
      enabledYears = era.years;
    } else {
      const expandedSeries = expandDisplaySeries(pendingSeries);
      enabledYears = era.years.filter(year => {
        const shows = showsByYear[year];
        if (!shows) return false;
        return shows.some(show => {
          const releases = getOfficialReleasesForDate(show.date);
          return releases.some(r => expandedSeries.includes(r.series));
        });
      });
    }

    const allSelected = enabledYears.length > 0 && enabledYears.every(y => pendingYears.includes(y));

    if (allSelected) {
      // Deselect all years in this era
      setPendingYears(prev => prev.filter(y => !enabledYears.includes(y)));
    } else {
      // Select all enabled years in this era
      setPendingYears(prev => [...new Set([...prev, ...enabledYears])]);
    }
  }, [pendingSeries, pendingYears, showsByYear]);

  // Reset all filters and apply immediately (keep tray open)
  const handleReset = useCallback(() => {
    const emptyFilters: ShowsFilterState = {
      selectedSeries: [],
      selectedYears: [],
    };
    setPendingSeries([]);
    setPendingYears([]);
    onApply(emptyFilters);
  }, [onApply]);

  // Apply filters and close
  const handleApply = useCallback(() => {
    const newFilters: ShowsFilterState = {
      selectedSeries: pendingSeries,
      selectedYears: pendingYears,
    };
    onApply(newFilters);
    onClose();
  }, [pendingSeries, pendingYears, onApply, onClose]);

  // Compute matching show count
  const matchingShowCount = useMemo(() => {
    if (!showsByYear) return 0;

    const allYears = Object.keys(showsByYear);

    // Determine which years to count
    let yearsToCount: string[];
    if (pendingYears.length > 0) {
      yearsToCount = pendingYears.filter(y => allYears.includes(y));
    } else {
      // If no years selected, count all years (series filter will apply)
      yearsToCount = allYears;
    }

    // Expand series for filtering
    const expandedSeries = pendingSeries.length > 0 ? expandDisplaySeries(pendingSeries) : [];

    let count = 0;
    yearsToCount.forEach(year => {
      const shows = showsByYear[year];
      if (!shows) return;

      if (expandedSeries.length > 0) {
        // Count only shows with releases from selected series
        const matchingShows = shows.filter(show => {
          const releases = getOfficialReleasesForDate(show.date);
          return releases.some(r => expandedSeries.includes(r.series));
        });
        count += matchingShows.length;
      } else {
        count += shows.length;
      }
    });

    return count;
  }, [showsByYear, pendingSeries, pendingYears]);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Filter Shows</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeText}>Close</Text>
            <Ionicons name="close" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SeriesSection
            selectedSeries={pendingSeries}
            onToggleSeries={handleToggleSeries}
            onSelectAll={handleSelectAllSeries}
          />

          <YearsSection
            selectedYears={pendingYears}
            selectedSeries={pendingSeries}
            showsByYear={showsByYear}
            onToggleYear={handleToggleYear}
            onSelectAllInEra={handleSelectAllInEra}
          />
        </ScrollView>

        {/* Bottom Action Bar */}
        <FilterActionBar
          matchingCount={matchingShowCount}
          onReset={handleReset}
          onApply={handleApply}
        />
      </View>
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
});

// Re-export types for convenience
export * from './types';
