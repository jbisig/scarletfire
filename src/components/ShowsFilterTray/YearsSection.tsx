import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShowsByYear } from './types';
import { groupYearsByEra } from '../../data/eras';
import { useResponsive } from '../../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

interface YearsSectionProps {
  selectedYears: string[];
  showsByYear: ShowsByYear | null;
  onToggleYear: (year: string) => void;
  onSelectAllInEra: (years: string[]) => void;
}

interface YearButtonProps {
  year: string;
  isSelected: boolean;
  isDisabled: boolean;
  isDesktop: boolean;
  onPress: () => void;
}

const YearButton = React.memo<YearButtonProps>(function YearButton({
  year,
  isSelected,
  isDisabled,
  isDesktop,
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
        isDesktop && styles.yearButtonDesktop,
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
  showsByYear,
  onToggleYear,
  onSelectAllInEra,
}) {
  const { isDesktop } = useResponsive();

  const availableYears = useMemo(
    () => (showsByYear ? Object.keys(showsByYear).sort() : []),
    [showsByYear]
  );

  // Years with zero shows are disabled
  const disabledYears = useMemo(() => {
    if (!showsByYear) return new Set<string>();
    return new Set(availableYears.filter(y => (showsByYear[y]?.length ?? 0) === 0));
  }, [availableYears, showsByYear]);

  const eraGroups = useMemo(() => groupYearsByEra(availableYears), [availableYears]);

  // Check if all years in an era are selected
  const isEraFullySelected = (years: string[]): boolean => {
    const enabledYears = years.filter(y => !disabledYears.has(y));
    return enabledYears.length > 0 && enabledYears.every(y => selectedYears.includes(y));
  };

  return (
    <View style={styles.section}>
      <Text style={styles.yearsHeading}>Years</Text>
      {eraGroups.map(({ era, years }) => {
        const eraFullySelected = isEraFullySelected(years);
        const hasEnabledYears = years.some(y => !disabledYears.has(y));

        return (
          <View key={era.id} style={styles.eraContainer}>
            <View style={styles.eraHeader}>
              <Text style={styles.eraName}>{era.label}</Text>
              {hasEnabledYears && (
                <TouchableOpacity
                  onPress={() => onSelectAllInEra(years)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectAllText}>
                    {eraFullySelected ? 'Clear all' : 'Select all'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.yearsGrid}>
              {years.map(year => (
                <YearButton
                  key={year}
                  year={year}
                  isSelected={selectedYears.includes(year)}
                  isDisabled={disabledYears.has(year)}
                  isDesktop={isDesktop}
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
    paddingTop: SPACING.xxl,
  },
  // Styled like TagCategorySection's `title` — uppercase label above the
  // era groups, matching the tag section headings above it in the tray.
  yearsHeading: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  eraContainer: {
  },
  eraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.full,
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
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.background,
  },
  yearButton: {
    width: '25%',
  },
  yearButtonDesktop: {
    width: '16.666%',
  },
  yearButtonDisabled: {
    opacity: 0.4,
  },
  yearText: {
    ...TYPOGRAPHY.bodyLarge,
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
    backgroundColor: COLORS.background,
    height: 64,
  },
  yearContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    position: 'absolute',
    right: SPACING.md,
  },
});
