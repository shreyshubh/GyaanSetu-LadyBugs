/**
 * Update streak for a user based on their activity date.
 * Rules:
 *   - Same day as last active → no change
 *   - Yesterday → increment streak
 *   - Older → reset to 1
 * @param {Object} user - Mongoose user document
 * @param {Date} activityDate - when the activity occurred (defaults to now)
 */
const updateStreak = (user, activityDate = new Date()) => {
  const today = new Date(activityDate);
  today.setHours(0, 0, 0, 0);

  const lastActive = user.gamification.last_active_date;

  if (!lastActive) {
    // First ever activity
    user.gamification.current_streak = 1;
    user.gamification.longest_streak = Math.max(1, user.gamification.longest_streak);
    user.gamification.last_active_date = today;
    return;
  }

  const lastDate = new Date(lastActive);
  lastDate.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day — no change
    return;
  } else if (diffDays === 1) {
    // Yesterday — increment streak
    user.gamification.current_streak += 1;
  } else {
    // Older — reset
    user.gamification.current_streak = 1;
  }

  // Update longest streak if current beats it
  if (user.gamification.current_streak > user.gamification.longest_streak) {
    user.gamification.longest_streak = user.gamification.current_streak;
  }

  user.gamification.last_active_date = today;
};

module.exports = { updateStreak };
