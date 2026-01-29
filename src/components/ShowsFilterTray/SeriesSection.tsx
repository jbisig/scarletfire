import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FilterPill } from './FilterPill';
import { DISPLAY_SERIES } from '../../data/officialReleases';
import { COLORS, FONTS } from '../../constants/theme';

interface SeriesSectionProps {
  selectedSeries: string[];
  onToggleSeries: (series: string) => void;
  onSelectAll: () => void;
}

export const SeriesSection = React.memo<SeriesSectionProps>(function SeriesSection({
  selectedSeries,
  onToggleSeries,
  onSelectAll,
}) {
  const allSelected = DISPLAY_SERIES.every(s => selectedSeries.includes(s));

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>By Official Release Series</Text>
        <TouchableOpacity onPress={onSelectAll} activeOpacity={0.7}>
          <Text style={styles.selectAllText}>
            {allSelected ? 'Clear all' : 'Select all'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.pillsGrid}>
        {DISPLAY_SERIES.map(series => (
          <FilterPill
            key={series}
            label={series}
            isSelected={selectedSeries.includes(series)}
            onPress={() => onToggleSeries(series)}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.secondary,
    color: COLORS.accent,
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
