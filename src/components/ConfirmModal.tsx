import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { COLORS, TYPOGRAPHY, FONTS, SPACING, RADIUS } from '../constants/theme';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * App-styled confirmation dialog built on the shared `<BottomSheet>` primitive.
 * Replaces Alert.alert for destructive confirmations since RN Web's Alert with
 * a destructive button is unreliable.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onCancel}
      cardStyle={styles.card}
      swipeToDismiss={false}
    >
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <View style={styles.actions}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>{cancelLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onConfirm}
          style={[styles.confirmBtn, destructive && styles.confirmBtnDestructive]}
        >
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    gap: 12,
  },
  title: { ...TYPOGRAPHY.heading4, fontSize: 18 },
  message: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    // @ts-ignore web only
    cursor: 'pointer',
  },
  cancelText: {
    ...TYPOGRAPHY.label,
    fontFamily: FONTS.secondary,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    // @ts-ignore web only
    cursor: 'pointer',
  },
  confirmBtnDestructive: { backgroundColor: COLORS.error },
  confirmText: {
    ...TYPOGRAPHY.label,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});
