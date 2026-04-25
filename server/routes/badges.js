const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { BADGES } = require('../services/badges');

// GET /api/badges — Return all badges with earned/unseen status
router.get('/', protect, async (req, res) => {
  const earned = req.user.gamification.badges_earned || [];
  const unseen = req.user.gamification.badge_unseen || [];

  const allBadges = BADGES.map(b => ({
    ...b,
    earned: earned.includes(b.id),
    unseen: unseen.includes(b.id)
  }));

  res.json({ badges: allBadges, earned, unseen });
});

// PUT /api/badges/seen — Move badge from unseen → seen
router.put('/seen', protect, async (req, res) => {
  const { badgeId } = req.body;
  
  if (!badgeId) {
    return res.status(400).json({ message: 'badgeId is required' });
  }

  const unseen = req.user.gamification.badge_unseen || [];
  const idx = unseen.indexOf(badgeId);
  
  if (idx !== -1) {
    unseen.splice(idx, 1);
    if (!req.user.gamification.badge_seen) req.user.gamification.badge_seen = [];
    req.user.gamification.badge_seen.push(badgeId);
    await req.user.save();
  }

  res.json({ message: 'Badge marked as seen' });
});

module.exports = router;
