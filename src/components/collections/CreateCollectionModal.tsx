import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
  Animated,
  PanResponder,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import { CollectionType } from '../../types/collection.types';
import { useCollections } from '../../contexts/CollectionsContext';
import { useToast } from '../../contexts/ToastContext';
import { COLORS, TYPOGRAPHY, FONTS, SPACING, RADIUS } from '../../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  initialType?: CollectionType;
  onCreated?: (collectionId: string) => void;
}

export function CreateCollectionModal({
  visible,
  onClose,
  initialType = 'show_collection',
  onCreated,
}: Props) {
  const { createCollection } = useCollections();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const type: CollectionType = initialType;
  const isPlaylist = type === 'playlist';
  const titleText = isPlaylist ? 'New Playlist' : 'New Show Collection';
  const namePlaceholder = isPlaylist ? 'e.g. Best Dark Stars' : 'e.g. Best 77 Shows';

  // Animate opacity (backdrop fade) + card slide-up on native. Web uses fade
  // only since the card is centered. Keep the Modal mounted for the duration
  // of the exit animation via `rendered`.
  const [rendered, setRendered] = useState(visible);
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(visible ? 0 : 600)).current;
  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 600, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const reset = () => {
    setName('');
    setDescription('');
    setSubmitting(false);
  };

  const handleCreate = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created = await createCollection({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
      });
      reset();
      onClose();
      onCreated?.(created.id);
    } catch (e) {
      setSubmitting(false);
      const msg = e instanceof Error ? e.message : 'Failed to create collection';
      // Close the modal so the toast isn't hidden behind its overlay.
      onClose();
      showToast(msg, 'error');
    }
  };

  const isWeb = Platform.OS === 'web';

  // Track keyboard height so we can lift the bottom-sheet above it on native.
  // KeyboardAvoidingView alone is unreliable when the sheet is inside a Modal.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    if (isWeb) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);
    const s = Keyboard.addListener(showEvent, onShow);
    const h = Keyboard.addListener(hideEvent, onHide);
    return () => {
      s.remove();
      h.remove();
    };
  }, [isWeb]);

  // Swipe-to-dismiss gesture (native only). Updates translateY live with the
  // drag, and either dismisses (if dragged past threshold or flung down) or
  // snaps back on release.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => !isWeb && g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        translateY.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        const shouldDismiss = g.dy > 120 || g.vy > 0.6;
        if (shouldDismiss) {
          onClose();
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={rendered}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity }]}>
        <Pressable
          style={[styles.backdrop, isWeb && styles.backdropWeb]}
          onPress={onClose}
        >
          <Animated.View
            style={
              isWeb
                ? styles.cardWrapperWeb
                : [
                    styles.cardWrapperNative,
                    { transform: [{ translateY }], bottom: keyboardHeight },
                  ]
            }
            {...(isWeb ? {} : panResponder.panHandlers)}
          >
          <Pressable
            style={[styles.card, isWeb && styles.cardWeb]}
            onPress={() => {}}
          >
          {!isWeb && <View style={styles.grabber} />}
          <Text style={styles.title}>{titleText}</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={namePlaceholder}
            placeholderTextColor={COLORS.textSecondary}
            autoFocus
            maxLength={80}
          />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={COLORS.textSecondary}
            multiline
            maxLength={280}
          />

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={!name.trim() || submitting}
              style={[styles.createBtn, (!name.trim() || submitting) && styles.disabledBtn]}
            >
              <Text style={styles.createText}>{submitting ? 'Creating…' : 'Create'}</Text>
            </TouchableOpacity>
          </View>
          </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
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
    backgroundColor: COLORS.background,
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 8,
  },
  cardWrapperWeb: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 16,
  },
  cardWrapperNative: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardWeb: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginTop: -6,
    marginBottom: 8,
  },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  label: { color: COLORS.textSecondary, fontSize: 13, marginTop: 8 },
  input: {
    backgroundColor: COLORS.searchBackground,
    color: COLORS.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputMulti: { minHeight: 60, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.searchBackground,
  },
  typeChipActive: { backgroundColor: COLORS.accent },
  typeText: { color: COLORS.textSecondary, fontSize: 13 },
  typeTextActive: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  cancelBtn: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    // @ts-ignore web only
    cursor: 'pointer',
  },
  cancelText: {
    ...TYPOGRAPHY.label,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  createBtn: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    // @ts-ignore web only
    cursor: 'pointer',
  },
  disabledBtn: { opacity: 0.5 },
  createText: {
    ...TYPOGRAPHY.label,
    fontFamily: FONTS.secondary,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});
