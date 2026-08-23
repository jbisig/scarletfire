/** Web/Electron: downloads are unsupported, so the app is always "online on Wi-Fi". */
export interface NetworkStatus {
  isConnected: boolean;
  isWifi: boolean;
}

const ALWAYS_ONLINE: NetworkStatus = { isConnected: true, isWifi: true };

export function getNetworkStatus(): NetworkStatus {
  return ALWAYS_ONLINE;
}

export function subscribeNetworkStatus(_listener: () => void): () => void {
  return () => {};
}

export function applyNetworkState(_state: { type?: string; isConnected?: boolean }): void {}

export function startNetworkMonitoring(): void {}

export function resetNetworkStatusForTests(): void {}
