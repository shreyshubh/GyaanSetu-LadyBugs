import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to display and manage the current streak.
 * Streak is updated server-side on login; this just exposes the value.
 */
const useStreak = () => {
  const { user } = useAuth();
  
  const currentStreak = user?.gamification?.current_streak || 0;
  const longestStreak = user?.gamification?.longest_streak || 0;
  const lastActive = user?.gamification?.last_active_date;

  return { currentStreak, longestStreak, lastActive };
};

export default useStreak;
