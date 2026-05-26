import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    Network.getNetworkStateAsync().then((state) => {
      setIsConnected(Boolean(state.isConnected));
    });

    const subscription = Network.addNetworkStateListener((state) => {
      setIsConnected(Boolean(state.isConnected));
    });

    return () => subscription.remove();
  }, []);

  return {
    isConnected,
  };
}
