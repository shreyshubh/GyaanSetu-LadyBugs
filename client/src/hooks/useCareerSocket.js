import { useEffect, useRef } from 'react';

export const useCareerSocket = (token, onCareerUpdate) => {
  const wsRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const wsBase = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    const wsUrl = `${wsBase}?token=${token}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'CAREER_UPDATE') {
            onCareerUpdate(msg.payload);
          }
        } catch (err) {
          console.error('WS message parse error', err);
        }
      };

      wsRef.current.onerror = (err) => console.error('WS error', err);
    } catch (err) {
      console.error('WS connection failed', err);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [token]);
};
