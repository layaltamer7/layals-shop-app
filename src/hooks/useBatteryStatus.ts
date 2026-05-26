import { useEffect, useState } from 'react';
import * as Battery from 'expo-battery';

import { getBatteryAwareSyncState } from '../services/deviceService';

export function useBatteryStatus() {
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [syncPaused, setSyncPaused] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      const result = await getBatteryAwareSyncState();
      setBatteryLevel(result.batteryLevel);
      setSyncPaused(result.syncPaused);
    };

    refresh();
    const batterySubscription = Battery.addBatteryLevelListener(() => refresh());
    const modeSubscription = Battery.addLowPowerModeListener(() => refresh());

    return () => {
      batterySubscription.remove();
      modeSubscription.remove();
    };
  }, []);

  return {
    batteryLevel,
    syncPaused,
  };
}
