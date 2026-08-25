import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from './BottomSheet';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

export interface ActionSheetAction {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Second line under the label, in secondary text (e.g. what a choice means). */
  detail?: string;
  /** Marks the currently-active choice with a checkmark (for picker-style trays). */
  selected?: boolean;
  destructive?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Optional context line shown above the actions (e.g. the item's name). */
  title?: string;
  actions: ActionSheetAction[];
}

/**
 * Spotify-style action tray: a BottomSheet listing icon + label rows, shared
 * by every "…" menu. On native it slides up from the bottom; on web it's the
 * same centered modal as the other collection sheets.
 *
 * The tapped action runs shortly AFTER the tray starts closing, so an action
 * that opens another modal (picker, confirm) doesn't try to present while
 * this one is still dismissing.
 */
export function ActionSheet({ visible, onClose, title, actions }: ActionSheetProps) {
  const handlePress = (action: ActionSheetAction) => {
    onClose();
    setTimeout(action.onPress, 250);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={styles.row}
          onPress={() => handlePress(action)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityHint={action.detail}
          accessibilityState={{ selected: !!action.selected }}
        >
          {action.icon ? (
            <Ionicons
              name={action.icon}
              size={22}
              color={
                action.destructive
                  ? COLORS.error
                  : action.selected
                    ? COLORS.accent
                    : COLORS.textPrimary
              }
            />
          ) : null}
          <View style={styles.rowTextWrap}>
            <Text
              style={[
                styles.rowText,
                action.destructive && styles.rowTextDestructive,
                action.selected && styles.rowTextSelected,
              ]}
            >
              {action.label}
            </Text>
            {action.detail ? <Text style={styles.rowDetail}>{action.detail}</Text> : null}
          </View>
        </TouchableOpacity>
      ))}
      {/* Breathing room so the last action doesn't hug the bottom edge. */}
      <View style={styles.bottomSpacer} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    ...TYPOGRAPHY.heading4,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
  },
  rowTextWrap: {
    flex: 1,
    gap: 2,
  },
  rowText: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    flexShrink: 1,
  },
  rowTextSelected: {
    color: COLORS.accent,
  },
  rowDetail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  rowTextDestructive: {
    color: COLORS.error,
  },
  bottomSpacer: {
    height: SPACING.lg,
  },
});
