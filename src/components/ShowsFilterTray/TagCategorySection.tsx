import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterPill } from './FilterPill';
import type { TagCategory, TagDef, TagId } from '../../constants/tags';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

interface TagCategorySectionProps {
  category: TagCategory;
  tags: readonly TagDef[];
  selected: TagId[];
  counts: Record<TagId, number>;
  /** What the pill counts count — "shows" (default) or "songs". */
  noun?: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleTag: (id: TagId) => void;
}

export function TagCategorySection({ category, tags, selected, counts, noun = 'shows', expanded, onToggleExpanded, onToggleTag }: TagCategorySectionProps) {
  const activeCount = tags.filter(t => selected.includes(t.id)).length;
  return (
    <View style={styles.section}>
      <TouchableOpacity
        testID={`tag-section-${category.id}`}
        style={styles.header}
        onPress={onToggleExpanded}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${category.label} filters${activeCount ? `, ${activeCount} selected` : ''}`}
      >
        <Text style={styles.title}>{category.label}</Text>
        {activeCount > 0 && (
          <View style={styles.activeChip}><Text style={styles.activeChipText}>{activeCount} selected</Text></View>
        )}
        <View style={styles.spacer} />
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.pillsGrid}>
          {tags.map(tag => {
            const isSelected = selected.includes(tag.id);
            const count = counts[tag.id] ?? 0;
            const isDisabled = count === 0 && !isSelected;
            return (
              <FilterPill
                key={tag.id}
                testID={`tag-pill-${tag.id}`}
                label={tag.label}
                count={count}
                noun={noun}
                isSelected={isSelected}
                isDisabled={isDisabled}
                onPress={() => onToggleTag(tag.id)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: SPACING.lg, paddingHorizontal: SPACING.xl },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  title: { ...TYPOGRAPHY.label, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  activeChip: { marginLeft: SPACING.sm, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full, backgroundColor: COLORS.accent },
  activeChipText: { ...TYPOGRAPHY.caption, color: '#FFFFFF', fontWeight: '600' },
  spacer: { flex: 1 },
  pillsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.sm },
});
