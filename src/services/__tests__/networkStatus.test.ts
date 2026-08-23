import {
  applyNetworkState,
  getNetworkStatus,
  resetNetworkStatusForTests,
  startNetworkMonitoring,
  subscribeNetworkStatus,
} from '../networkStatus';

const ExpoNetwork = require('expo-network');
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

beforeEach(() => {
  resetNetworkStatusForTests();
  ExpoNetwork.__resetNetworkState();
});

describe('networkStatus', () => {
  it('is optimistic before monitoring starts', () => {
    expect(getNetworkStatus()).toEqual({ isConnected: true, isWifi: true });
  });

  it('maps expo-network state: wifi/ethernet/unknown count as Wi-Fi, cellular does not', () => {
    applyNetworkState({ type: 'CELLULAR', isConnected: true });
    expect(getNetworkStatus()).toEqual({ isConnected: true, isWifi: false });
    applyNetworkState({ type: 'ETHERNET', isConnected: true });
    expect(getNetworkStatus().isWifi).toBe(true);
    applyNetworkState({ type: 'UNKNOWN', isConnected: true });
    expect(getNetworkStatus().isWifi).toBe(true);
    applyNetworkState({ type: 'NONE', isConnected: false });
    expect(getNetworkStatus()).toEqual({ isConnected: false, isWifi: false });
  });

  it('reads the initial state and follows listener events once monitoring starts', async () => {
    ExpoNetwork.__setNetworkState({ type: 'CELLULAR' });
    const listener = jest.fn();
    subscribeNetworkStatus(listener);
    startNetworkMonitoring();
    startNetworkMonitoring(); // idempotent
    await flush();
    expect(getNetworkStatus().isWifi).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    ExpoNetwork.__setNetworkState({ type: 'WIFI' });
    expect(getNetworkStatus().isWifi).toBe(true);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(ExpoNetwork.addNetworkStateListener).toHaveBeenCalledTimes(1);
  });

  it('does not notify when nothing changed', () => {
    const listener = jest.fn();
    subscribeNetworkStatus(listener);
    applyNetworkState({ type: 'WIFI', isConnected: true });
    expect(listener).not.toHaveBeenCalled();
  });
});
