
import { useEffect } from 'react';

/**
 * Hook to synchronize offline data with the cloud.
 * Triggers on mount (e.g., app load or dashboard entry).
 */
export const useSyncData = () => {
  useEffect(() => {
    const syncWithCloud = async () => {
      // 1. Get the local data saved as "fallback"
      const localData = localStorage.getItem('offline_records');
      if (!localData) return;

      try {
        // 2. Send it to the synchronization endpoint
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: localData
        });

        if (response.ok) {
          console.log("Data synchronized with cloud successfully!");
          // 3. Clear local storage once cloud has confirmed receipt
          localStorage.removeItem('offline_records');
        }
      } catch (err) {
        console.error("Sync failed, will try again on next handshake", err);
      }
    };

    syncWithCloud();
  }, []); 
};

export default useSyncData;
