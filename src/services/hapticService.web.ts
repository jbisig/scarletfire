// No-op haptic service for web
const noop = () => {};

export const haptics = {
  light: noop,
  medium: noop,
  heavy: noop,
  selection: noop,
  success: noop,
  warning: noop,
  error: noop,
};
