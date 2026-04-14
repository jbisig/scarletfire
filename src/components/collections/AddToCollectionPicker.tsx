import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
  Animated,
  PanResponder,
  Keyboard,
  KeyboardEvent,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCollections } from '../../contexts/CollectionsContext';
import { CreateCollectionModal } from './CreateCollectionModal';
import {
  CollectionType,
  CollectionItemMetadata,
} from '../../types/collection.types';
import { collectionsService } from '../../services/collectionsService';
import { COLORS, TYPOGRAPHY, FONTS } from '../../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  type: CollectionType;
  itemIdentifier: string;
  itemMetadata: CollectionItemMetadata;
}

export function AddToCollectionPicker({
  visible,
  onClose,
  type,
  itemIdentifier,
  itemMetadata,
}: Props) {
  const { collections, addItem, removeItem } = useCollections();
  const filtered = useMemo(
    () => collections.filter((c) => c.type === type),
    [collections, type],
  );
  const [createVisible, setCreateVisible] = useState(false);
  const [memberships, setMemberships] = useState<Record<string, boolean>>({});

  const isWeb = Platform.OS === 'web';

  // Animated fade + slide, mirror of CreateCollectionModal.
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

  // Keyboard height for native bottom-sheet lift.
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

  // Swipe-to-dismiss (native only).
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

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const entries = await Promise.all(
        filtered.map(async (c) => {
          const items = await collectionsService.fetchCollectionItems(c.id);
          return [c.id, items.some((i) => i.itemIdentifier === itemIdentifier)] as const;
        }),
      );
      setMemberships(Object.fromEntries(entries));
    })();
  }, [visible, filtered, itemIdentifier]);

  const toggle = (collectionId: string) => {
    const wasIn = !!memberships[collectionId];
    setMemberships((prev) => ({ ...prev, [collectionId]: !wasIn }));
    const op = wasIn
      ? removeItem(collectionId, itemIdentifier)
      : addItem(collectionId, itemIdentifier, itemMetadata);
    op.catch(() => {
      setMemberships((prev) => ({ ...prev, [collectionId]: wasIn }));
    });
  };

  const title = type === 'playlist' ? 'Add to Playlist' : 'Add to Collection';
  const newLabel = type === 'playlist' ? 'New Playlist' : 'New Show Collection';

  return (
    <Modal visible={rendered} animationType="none" transparent onRequestClose={onClose}>
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
                    {
                      transform: [{ translateY }],
                      // When keyboard is open, lift the tray above it. Keep
                      // the -80 extension only when keyboard is hidden.
                      bottom: keyboardHeight > 0 ? keyboardHeight : -80,
                    },
                  ]
            }
            {...(isWeb ? {} : panResponder.panHandlers)}
          >
            <Pressable style={[styles.card, isWeb && styles.cardWeb]} onPress={() => {}}>
              {!isWeb && <View style={styles.grabber} />}

              <View style={styles.headerRow}>
                <Text style={styles.title}>{title}</Text>
                {isWeb && (
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={22} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={filtered}
                keyExtractor={(c) => c.id}
                style={isWeb ? styles.listWeb : styles.list}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.empty}>
                    No {type === 'playlist' ? 'playlists' : 'collections'} yet.
                  </Text>
                }
                renderItem={({ item }) => {
                  const selected = !!memberships[item.id];
                  return (
                    <Pressable
                      onPress={() => toggle(item.id)}
                      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    >
                      {({ pressed }) => (
                        <>
                          <Text
                            style={[
                              styles.rowText,
                              (selected || pressed) && styles.rowTextSelected,
                            ]}
                          >
                            {item.name}
                          </Text>
                          <View style={styles.checkSlot}>
                            {(selected || pressed) && (
                              <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                            )}
                          </View>
                        </>
                      )}
                    </Pressable>
                  );
                }}
              />

              <TouchableOpacity style={styles.newBtn} onPress={() => setCreateVisible(true)}>
                <Ionicons name="add" size={20} color={COLORS.accent} />
                <Text style={styles.newText}>{newLabel}</Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>

      <CreateCollectionModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        initialType={type}
        onCreated={async (createdId) => {
          await addItem(createdId, itemIdentifier, itemMetadata);
          setMemberships((prev) => ({ ...prev, [createdId]: true }));
        }}
      />
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
  cardWrapperWeb: {
    width: '100%',
    maxWidth: 480,
    // Shrinks to content; caps at 85% so tall lists become scrollable.
    maxHeight: '85%',
    paddingHorizontal: 16,
  },
  cardWrapperNative: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Extend 80pt below the visible bottom so the card ALWAYS flushes past
    // the home indicator / any inset. Internal paddingBottom compensates.
    bottom: -80,
    // Cap the wrapper height so the card's `maxHeight: 75%` has a concrete
    // parent height to resolve against (absolute-positioned parents have no
    // inherited height by default).
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  card: {
    backgroundColor: COLORS.background,
    paddingTop: 16,
    // Extra bottom padding to clear the iOS home indicator area since the
    // card is pinned below bottom: 0 and extends past the safe area.
    paddingBottom: 88,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
  },
  cardWeb: {
    width: '100%',
    maxWidth: 480,
    // Auto-height: shrinks to content, grows up to wrapper's maxHeight.
    paddingBottom: 0,
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    // @ts-ignore web only
    overflow: 'auto',
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
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  listWeb: {
    // On web, let the list grow to content height; outer maxHeight handles
    // overflow via the card's own scroll.
    flexGrow: 0,
    flexShrink: 0,
  },
  listContent: {
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: { ...TYPOGRAPHY.heading4, fontSize: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowPressed: {
    backgroundColor: COLORS.accentTransparent,
  },
  checkSlot: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { ...TYPOGRAPHY.body, fontSize: 15 },
  rowTextSelected: { color: COLORS.accent },
  empty: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  newText: {
    fontFamily: FONTS.secondary,
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
