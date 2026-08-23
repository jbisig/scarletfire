/**
 * Synchronously readable network state for non-React code (the download
 * engine's Wi-Fi guard, archiveApi's offline fallback). Optimistic until the
 * first expo-network read lands so nothing blocks on startup.
 */
import * as Network from 'expo-network';

export interface NetworkStatus {
  isConnected: boolean;
  isWifi: boolean;
}

let status: NetworkStatus = { isConnected: true, isWifi: true };
const listeners = new Set<() => void>();
let subscription: { remove: () => void } | null = null;

const WIFI_LIKE = new Set<string>([
  Network.NetworkStateType.WIFI,
  Network.NetworkStateType.ETHERNET,
  // Cannot prove cellular — don't hold downloads hostage to an unknown type.
  Network.NetworkStateType.UNKNOWN,
]);

export function getNetworkStatus(): NetworkStatus {
  return status;
}

export function subscribeNetworkStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function applyNetworkState(state: { type?: string; isConnected?: boolean }): void {
  const isConnected = state.isConnected !== false;
  const isWifi = isConnected && WIFI_LIKE.has(state.type ?? Network.NetworkStateType.UNKNOWN);
  if (status.isConnected === isConnected && status.isWifi === isWifi) return;
  status = { isConnected, isWifi };
  listeners.forEach(l => l());
}

/** Idempotent: first call reads the current state and subscribes to changes. */
export function startNetworkMonitoring(): void {
  if (subscription) return;
  subscription = Network.addNetworkStateListener(applyNetworkState);
  Network.getNetworkStateAsync().then(applyNetworkState).catch(() => {});
}

export function resetNetworkStatusForTests(): void {
  status = { isConnected: true, isWifi: true };
  listeners.clear();
  subscription?.remove();
  subscription = null;
}
