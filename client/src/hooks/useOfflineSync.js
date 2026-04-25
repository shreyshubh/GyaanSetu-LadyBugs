import { useEffect, useState } from 'react';
import { getQueue, clearQueue } from '../utils/indexedDB';
import axios from 'axios';

/**
 * Hook to detect online/offline status and sync queued offline actions.
 * Shows a banner state that the consumer can use to render UI.
 */
const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(null); // null | 'syncing' | 'synced' | 'error'

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Attempt sync
      try {
        const queue = await getQueue();
        if (queue.length > 0) {
          setSyncStatus('syncing');
          await axios.post('/api/sync/push', { queue });
          await clearQueue();
          setSyncStatus('synced');
          setTimeout(() => setSyncStatus(null), 3000);
        }
      } catch (err) {
        console.error('Sync failed:', err);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus(null), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, syncStatus };
};

export default useOfflineSync;
