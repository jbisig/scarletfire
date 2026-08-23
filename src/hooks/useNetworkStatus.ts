import { useEffect, useSyncExternalStore } from 'react';
import {
  getNetworkStatus,
  NetworkStatus,
  startNetworkMonitoring,
  subscribeNetworkStatus,
} from '../services/networkStatus';

/** `{ isConnected, isWifi }`, live. Starts monitoring on first use. */
export function useNetworkStatus(): NetworkStatus {
  useEffect(() => { startNetworkMonitoring(); }, []);
  return useSyncExternalStore(subscribeNetworkStatus, getNetworkStatus, getNetworkStatus);
}
