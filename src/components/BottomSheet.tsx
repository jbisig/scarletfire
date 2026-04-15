import React, { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardEvent,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../constants/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Contents rendered inside the card. */
  children: ReactNode;
  /** Additional style for the inner card container. */
  cardStyle?: StyleProp<ViewStyle>;
  /** Web-only: maximum card width when centered. Defaults to 480. */
  webMaxWidth?: number;
  /**
   * On native, the card is pinned to the bottom of the screen and extends
   * 80pt below the safe area so it reaches the display edge. Set false if
   * the caller already handles its own bottom insets.
   */
  extendBelowSafeArea?: boolean;
  /** Render a grabber bar at the top of the card (native only). */
  showGrabber?: boolean;
  /** Allow swipe-to-dismiss on native. Defaults to true. */
  swipeToDismiss?: boolean;
}

/**
 * Shared bottom-sheet primitive. On native it slides up from the bottom with
 * a keyboard-avoiding behavior, swipe-to-dismiss, and a grabber. On web it
 * fades in as a centered modal with backdrop-click dismissal. Used for all
 * modals in the collections feature (create, picker, confirm, rename).
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  cardStyle,
  webMaxWidth = 480,
  extendBelowSafeArea = true,
  showGrabber = true,
  swipeToDismiss = true,
}: BottomSheetProps) {
  const isWeb = Platform.OS === 'web';

  // Mount/unmount with exit animation.
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

  // Keyboard height for lifting the sheet above it on native.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    if (isWeb) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    // Use keyboardDidHide (not Will) so the sheet only animates back down
    // after the keyboard is fully gone — otherwise mid-tap layout shifts
    // can move buttons out from under the user's finger.
    const hideEvent = 'keyboardDidHide';
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
      onMoveShouldSetPanResponder: (_, g) =>
        !isWeb && swipeToDismiss && g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
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

  // Web: wrapper has a maxHeight tied to 85% of viewport so tall content scrolls.
  const webWrapperStyle: ViewStyle = {
    width: '100%',
    maxWidth: webMaxWidth,
    maxHeight: Dimensions.get('window').height * 0.85,
    paddingHorizontal: 16,
  };

  // Native: absolute-positioned bottom card, extended past the safe area.
  const nativeWrapperStyle: ViewStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom:
      keyboardHeight > 0
        ? keyboardHeight
        : extendBelowSafeArea
          ? -80
          : 0,
    maxHeight: Dimensions.get('window').height * 0.8,
  };

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
                ? webWrapperStyle
                : [nativeWrapperStyle, { transform: [{ translateY }] }]
            }
            {...(isWeb ? {} : panResponder.panHandlers)}
          >
            <View
              style={[
                styles.card,
                isWeb && styles.cardWeb,
                cardStyle,
              ]}
              // Block taps on empty card area from bubbling to the backdrop
              // Pressable (which would close the sheet). Children that claim
              // the responder (TouchableOpacity/TextInput) still win because
              // bubble phase resolves deepest-first.
              onStartShouldSetResponder={() => true}
              // Web only: RN-Web's Pressable fires on DOM click bubbling,
              // which the responder system above doesn't stop. Explicitly
              // halt click propagation so taps on TextInput and empty card
              // area don't reach the backdrop.
              {...(isWeb
                ? // @ts-ignore web-only prop
                  { onClick: (e: any) => e.stopPropagation() }
                : {})}
            >
              {!isWeb && showGrabber && <View style={styles.grabber} />}
              {children}
            </View>
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
    paddingTop: 16,
    // Extra bottom padding so content clears the iOS home indicator area,
    // which is hidden underneath the card when extendBelowSafeArea is true.
    paddingBottom: 88,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardWeb: {
    paddingBottom: 16,
    borderRadius: 16,
  },
  cardKeyboardOpen: {
    // When the keyboard is up, the sheet already sits flush above it — no
    // need for the 80pt home-indicator buffer.
    paddingBottom: 16,
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
});
