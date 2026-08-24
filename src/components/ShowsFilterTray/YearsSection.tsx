import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShowsByYear, FILTER_ERA_GROUPS } from './types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

interface YearsSectionProps {
  selectedYears: string[];
  showsByYear: ShowsByYear | null;
  /** Collapsible like the tag sections above it. */
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleYear: (year: string) => void;
  onSelectAllInEra: (years: string[]) => void;
}

interface YearButtonProps {
  year: string;
  isSelected: boolean;
  isDisabled: boolean;
  /** Column position: edge columns hug the margins, middles center. */
  justify: 'flex-start' | 'center' | 'flex-end';
  onPress: () => void;
}

const YearButton = React.memo<YearButtonProps>(function YearButton({
  year,
  isSelected,
  isDisabled,
  justify,
  onPress,
}) {
  const checkmarkOpacity = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(checkmarkOpacity, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isSelected, checkmarkOpacity]);

  return (
    <TouchableOpacity
      style={[styles.yearButton, { justifyContent: justify }, isDisabled && styles.yearButtonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityLabel={year}
      accessibilityState={{ checked: isSelected, disabled: isDisabled }}
    >
      <Text
        style={[
          styles.yearText,
          isSelected && styles.yearTextSelected,
          isDisabled && styles.yearTextDisabled,
        ]}
      >
        {year}
      </Text>
      {/* Fixed-width slot so a button's width is identical selected or not —
          keeps the wrapped rows from reflowing when a year is toggled. */}
      <Animated.View style={[styles.checkmark, { opacity: checkmarkOpacity }]}>
        <Ionicons name="checkmark" size={16} color={COLORS.accent} />
      </Animated.View>
    </TouchableOpacity>
  );
});

export const YearsSection = React.memo<YearsSectionProps>(function YearsSection({
  selectedYears,
  showsByYear,
  expanded,
  onToggleExpanded,
  onToggleYear,
  onSelectAllInEra,
}) {
  const availableYears = useMemo(
    () => (showsByYear ? Object.keys(showsByYear).sort() : []),
    [showsByYear]
  );
  const availableSet = useMemo(() => new Set(availableYears), [availableYears]);

  // Years with zero shows are disabled
  const disabledYears = useMemo(() => {
    if (!showsByYear) return new Set<string>();
    return new Set(availableYears.filter(y => (showsByYear[y]?.length ?? 0) === 0));
  }, [availableYears, showsByYear]);

  // The five broad era groups, narrowed to years the catalog actually has.
  const eraGroups = useMemo(
    () =>
      FILTER_ERA_GROUPS
        .map(g => ({ name: g.name, years: g.years.filter(y => availableSet.has(y)) }))
        .filter(g => g.years.length > 0),
    [availableSet]
  );

  // Check if all years in an era are selected
  const isEraFullySelected = (years: string[]): boolean => {
    const enabledYears = years.filter(y => !disabledYears.has(y));
    return enabledYears.length > 0 && enabledYears.every(y => selectedYears.includes(y));
  };

  const activeCount = selectedYears.length;

  return (
    <View style={styles.section}>
      {/* Header mirrors TagCategorySection so Years reads as one more accordion. */}
      <TouchableOpacity
        testID="years-section-header"
        style={styles.sectionHeader}
        onPress={onToggleExpanded}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`Year filters${activeCount ? `, ${activeCount} selected` : ''}`}
      >
        <Text style={styles.sectionTitle}>Years</Text>
        {activeCount > 0 && (
          <View style={styles.activeChip}>
            <Text style={styles.activeChipText}>{activeCount} selected</Text>
          </View>
        )}
        <View style={styles.spacer} />
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {expanded && eraGroups.map(({ name, years }) => {
        const eraFullySelected = isEraFullySelected(years);
        const hasEnabledYears = years.some(y => !disabledYears.has(y));

        return (
          <View key={name} style={styles.eraContainer}>
            {/* Flat header with a hairline under it — no fill, no inset. */}
            <View style={styles.eraHeader}>
              <Text style={styles.eraName}>{name}</Text>
              {hasEnabledYears && (
                <TouchableOpacity
                  onPress={() => onSelectAllInEra(years)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${eraFullySelected ? 'Clear all' : 'Select all'} years in ${name}`}
                >
                  <Text style={styles.selectAllText}>
                    {eraFullySelected ? 'Clear all' : 'Select all'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.yearsGrid}>
              {years.map((year, i) => (
                <YearButton
                  key={year}
                  year={year}
                  isSelected={selectedYears.includes(year)}
                  isDisabled={disabledYears.has(year)}
                  justify={i % 5 === 0 ? 'flex-start' : i % 5 === 4 ? 'flex-end' : 'center'}
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
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  // Copies TagCategorySection's header styling.
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeChip: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
  },
  activeChipText: {
    ...TYPOGRAPHY.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  eraContainer: {
    marginTop: SPACING.md,
  },
  eraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  eraName: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  selectAllText: {
    ...TYPOGRAPHY.label,
    fontWeight: '500',
    color: COLORS.accent,
  },
  // Locked 5-column grid: years align vertically across rows, packed
  // left-to-right so consecutive years sit side by side.
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  yearButton: {
    width: '20%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  yearButtonDisabled: {
    opacity: 0.4,
  },
  yearText: {
    ...TYPOGRAPHY.bodyLarge,
  },
  yearTextSelected: {
    color: COLORS.accent,
  },
  yearTextDisabled: {
    color: COLORS.textSecondary,
  },
  checkmark: {
    width: 16,
    marginLeft: 2,
  },
});
