/**
 * Badge definitions and non-blocking badge check logic.
 * Badge checks are fire-and-forget — they never block the main response.
 */

const BADGES = [
  { id: 'first_step',        name: 'First Step',        icon: '🌱', description: 'Study your first topic',              condition: 'total_topics_studied >= 1' },
  { id: 'three_streak',      name: '3 Day Streak',      icon: '🔥', description: '3 days in a row',                     condition: 'current_streak >= 3' },
  { id: 'week_warrior',      name: 'Week Warrior',      icon: '⚡', description: '7 day streak',                        condition: 'current_streak >= 7' },
  { id: 'fortnight_fighter', name: 'Fortnight Fighter',  icon: '🏆', description: '14 day streak',                      condition: 'current_streak >= 14' },
  { id: 'month_master',      name: 'Month Master',      icon: '💎', description: '30 day streak',                       condition: 'current_streak >= 30' },
  { id: 'sharp_shooter',     name: 'Sharp Shooter',     icon: '🎯', description: 'Score 90%+ on first attempt',         condition: 'quiz score >= 90 on first try' },
  { id: 'quiz_master',       name: 'Quiz Master',       icon: '🧠', description: 'Complete 10 quizzes',                 condition: 'total_quizzes_taken >= 10' },
  { id: 'bookworm',          name: 'Bookworm',          icon: '📚', description: 'Tick 50 topics as studied',           condition: 'total_topics_studied >= 50' },
  { id: 'speed_demon',       name: 'Speed Demon',       icon: '🚀', description: 'Answer 10 questions under 15s each',  condition: 'fast answers count >= 10' },
  { id: 'multilingual',      name: 'Multilingual',      icon: '🌍', description: 'Use the app in Hindi',                condition: 'language === hi' },
  { id: 'comeback_kid',      name: 'Comeback Kid',      icon: '💪', description: 'Improve score by 30%+ on retake',     condition: 'retake improvement >= 30' },
  { id: 'syllabus_slayer',   name: 'Syllabus Slayer',   icon: '⭐', description: 'Tick 100% topics in a subject',       condition: 'all topics in any subject studied' },
  { id: 'sync_star',         name: 'Sync Star',         icon: '🔄', description: 'Sync offline progress 3 times',       condition: 'offline_sync_count >= 3' },
  { id: 'career_ready',      name: 'Career Ready',      icon: '🎓', description: 'Complete career guidance',            condition: 'career guidance viewed' },
];

/**
 * Award a badge if not already earned.
 * Pushes to badges_earned and badge_unseen.
 */
const awardBadge = (user, badgeId) => {
  if (!user.gamification.badges_earned) user.gamification.badges_earned = [];
  if (!user.gamification.badge_unseen) user.gamification.badge_unseen = [];
  
  if (!user.gamification.badges_earned.includes(badgeId)) {
    user.gamification.badges_earned.push(badgeId);
    user.gamification.badge_unseen.push(badgeId);
    return true; // new badge awarded
  }
  return false;
};

/**
 * Check and award badges based on context.
 * context.trigger tells us which endpoint fired this check.
 * Non-blocking: call with setImmediate from route handlers.
 * 
 * @param {Object} user - Mongoose user document (will be saved)
 * @param {Object} context - { trigger: 'tick'|'grade'|'login'|'sync'|'career', ...extra data }
 */
const checkBadges = async (user, context = {}) => {
  try {
    const g = user.gamification;
    let changed = false;

    // --- Streak badges (triggered by login) ---
    if (context.trigger === 'login') {
      if (g.current_streak >= 3)  changed = awardBadge(user, 'three_streak') || changed;
      if (g.current_streak >= 7)  changed = awardBadge(user, 'week_warrior') || changed;
      if (g.current_streak >= 14) changed = awardBadge(user, 'fortnight_fighter') || changed;
      if (g.current_streak >= 30) changed = awardBadge(user, 'month_master') || changed;
      if (user.language === 'hi') changed = awardBadge(user, 'multilingual') || changed;
    }

    // --- Study badges (triggered by tick) ---
    if (context.trigger === 'tick') {
      if (g.total_topics_studied >= 1)  changed = awardBadge(user, 'first_step') || changed;
      if (g.total_topics_studied >= 50) changed = awardBadge(user, 'bookworm') || changed;

      // Syllabus slayer: check if any subject has ALL topics studied
      const activeSyllabus = user.getActiveSyllabus();
      if (activeSyllabus?.subjects) {
        for (const subject of activeSyllabus.subjects) {
          const allTopics = subject.units.flatMap(u => u.topics);
          if (allTopics.length > 0 && allTopics.every(t => t.studied)) {
            changed = awardBadge(user, 'syllabus_slayer') || changed;
            break;
          }
        }
      }
    }

    // --- Quiz badges (triggered by grade) ---
    if (context.trigger === 'grade') {
      if (g.total_quizzes_taken >= 10) changed = awardBadge(user, 'quiz_master') || changed;

      // Sharp shooter: 90%+ on first attempt for a topic set
      if (context.scorePercent >= 90 && context.isFirstAttempt) {
        changed = awardBadge(user, 'sharp_shooter') || changed;
      }

      // Speed demon: 10+ questions answered under 15s each in one session
      if (context.fastAnswers >= 10) {
        changed = awardBadge(user, 'speed_demon') || changed;
      }

      // Comeback kid: improved by 30%+ on retake
      if (context.improvement >= 30) {
        changed = awardBadge(user, 'comeback_kid') || changed;
      }
    }

    // --- Sync badge ---
    if (context.trigger === 'sync') {
      if (g.offline_sync_count >= 3) changed = awardBadge(user, 'sync_star') || changed;
    }

    // --- Career badge ---
    if (context.trigger === 'career') {
      changed = awardBadge(user, 'career_ready') || changed;
    }

    if (changed) {
      await user.save();
    }
  } catch (err) {
    // Non-blocking — never crash the server
    console.error('Badge check error (non-blocking):', err);
  }
};

module.exports = { BADGES, checkBadges, awardBadge };
