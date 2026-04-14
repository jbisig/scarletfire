import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, FONTS } from '../constants/theme';

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
 * App-styled confirmation dialog. Renders as a bottom sheet on native and a
 * centered modal on web. Replaces Alert.alert for destructive confirmations
 * since RN Web's Alert with a destructive button is unreliable.
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
  const isWeb = Platform.OS === 'web';
  return (
    <Modal
      visible={visible}
      transparent
      animationType={isWeb ? 'fade' : 'slide'}
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={[styles.backdrop, isWeb && styles.backdropWeb]}
        onPress={onCancel}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={[styles.card, isWeb && styles.cardWeb]}
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
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: 'flex-end',
  },
  backdropWeb: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 12,
  },
  cardWeb: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
  },
  title: { ...TYPOGRAPHY.heading4, fontSize: 18 },
  message: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { fontFamily: FONTS.secondary, color: COLORS.textSecondary, fontSize: 15 },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
  },
  confirmBtnDestructive: { backgroundColor: COLORS.error },
  confirmText: { fontFamily: FONTS.secondary, color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
});
