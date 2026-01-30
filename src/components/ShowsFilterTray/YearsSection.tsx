import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FILTER_ERAS, FilterEra, ShowsByYear } from './types';
import { expandDisplaySeries, getOfficialReleasesForDate } from '../../data/officialReleases';
import { COLORS, FONTS } from '../../constants/theme';

interface YearsSectionProps {
  selectedYears: string[];
  selectedSeries: string[];
  showsByYear: ShowsByYear | null;
  onToggleYear: (year: string) => void;
  onSelectAllInEra: (era: FilterEra) => void;
}

interface YearButtonProps {
  year: string;
  isSelected: boolean;
  isDisabled: boolean;
  onPress: () => void;
}

const YearButton = React.memo<YearButtonProps>(function YearButton({
  year,
  isSelected,
  isDisabled,
  onPress,
}) {
  const animatedValue = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isSelected, animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const checkmarkOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <TouchableOpacity
      style={[
        styles.yearButton,
        isDisabled && styles.yearButtonDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      <View style={styles.yearButtonInner}>
        <Animated.View style={[styles.yearContent, { transform: [{ translateX }] }]}>
          <Text
            style={[
              styles.yearText,
              isSelected && styles.yearTextSelected,
              isDisabled && styles.yearTextDisabled,
            ]}
          >
            {year}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.checkmark, { opacity: checkmarkOpacity }]}>
          <Ionicons
            name="checkmark"
            size={20}
            color={COLORS.accent}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
});

export const YearsSection = React.memo<YearsSectionProps>(function YearsSection({
  selectedYears,
  selectedSeries,
  showsByYear,
  onToggleYear,
  onSelectAllInEra,
}) {
  // Compute which years should be disabled (no actual shows from selected series)
  const disabledYears = useMemo(() => {
    if (selectedSeries.length === 0 || !showsByYear) {
      return new Set<string>();
    }

    // Expand display series to actual series names
    const expandedSeries = expandDisplaySeries(selectedSeries);
    const allYears = FILTER_ERAS.flatMap(era => era.years);

    // For each year, check if there are actual shows with releases from selected series
    const yearsWithMatches = new Set<string>();
    allYears.forEach(year => {
      const shows = showsByYear[year];
      if (!shows) return;

      const hasMatch = shows.some(show => {
        const releases = getOfficialReleasesForDate(show.date);
        return releases.some(r => expandedSeries.includes(r.series));
      });

      if (hasMatch) {
        yearsWithMatches.add(year);
      }
    });

    return new Set(allYears.filter(y => !yearsWithMatches.has(y)));
  }, [selectedSeries, showsByYear]);

  // Check if all years in an era are selected
  const isEraFullySelected = (era: FilterEra): boolean => {
    const enabledYears = era.years.filter(y => !disabledYears.has(y));
    return enabledYears.length > 0 && enabledYears.every(y => selectedYears.includes(y));
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>By Year or Era</Text>

      {FILTER_ERAS.map(era => {
        const eraFullySelected = isEraFullySelected(era);
        const hasEnabledYears = era.years.some(y => !disabledYears.has(y));

        return (
          <View key={era.name} style={styles.eraContainer}>
            <View style={styles.eraHeader}>
              <Text style={styles.eraName}>{era.name}</Text>
              {hasEnabledYears && (
                <TouchableOpacity
                  onPress={() => onSelectAllInEra(era)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectAllText}>
                    {eraFullySelected ? 'Clear all' : 'Select all'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.yearsGrid}>
              {era.years.map(year => (
                <YearButton
                  key={year}
                  year={year}
                  isSelected={selectedYears.includes(year)}
                  isDisabled={disabledYears.has(year)}
                  onPress={() => onToggleYear(year)}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  eraContainer: {
  },
  eraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#191919',
    borderRadius: 50,
  },
  eraName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.secondary,
    color: '#AEAEAE',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.secondary,
    color: COLORS.accent,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#121212',
  },
  yearButton: {
    width: '25%',
  },
  yearButtonDisabled: {
    opacity: 0.4,
  },
  yearText: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  yearTextSelected: {
    color: COLORS.accent,
  },
  yearTextDisabled: {
    color: COLORS.textSecondary,
  },
  yearButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    height: 64,
  },
  yearContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    position: 'absolute',
    right: 12,
  },
});
