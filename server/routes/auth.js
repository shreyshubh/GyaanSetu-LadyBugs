const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { updateStreak } = require('../services/streak');
const { checkBadges } = require('../services/badges');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const migrateSyllabus = async (user) => {
  let changed = false;
  if (user.syllabus?.subjects?.length > 0 && (!user.syllabi || user.syllabi.length === 0)) {
    user.syllabi = [{ name: 'Default Syllabus', subjects: user.syllabus.subjects }];
    user.activeSyllabusId = user.syllabi[0]._id;
    changed = true;
  }
  if (!user.activeSyllabusId && user.syllabi?.length > 0) {
    user.activeSyllabusId = user.syllabi[0]._id;
    changed = true;
  }
  if (changed) {
    await user.save();
  }
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, password, language } = req.body;
    const email = String(req.body.email || '').toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const userExists = await User.findOne({ email: String(email) });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, language });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      language: user.language,
      gamification: user.gamification,
      syllabi: user.syllabi,
      activeSyllabusId: user.activeSyllabusId,
      pacing_profile: user.pacing_profile,
      quiz_history: user.quiz_history,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const password = req.body.password;
    const email = String(req.body.email || '').toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const user = await User.findOne({ email: String(email) });

    if (user && (await user.matchPassword(password))) {
      // Update streak on login
      updateStreak(user);
      await user.save();

      // Non-blocking badge checks for streak + multilingual
      setImmediate(() => {
        checkBadges(user, { trigger: 'login' });
      });

      await migrateSyllabus(user);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        language: user.language,
        gamification: user.gamification,
        syllabi: user.syllabi,
        activeSyllabusId: user.activeSyllabusId,
        pacing_profile: user.pacing_profile,
        quiz_history: user.quiz_history,
        career_profile: user.career_profile,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  await migrateSyllabus(user);
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    language: user.language,
    gamification: user.gamification,
    syllabi: user.syllabi,
    activeSyllabusId: user.activeSyllabusId,
    pacing_profile: user.pacing_profile,
    quiz_history: user.quiz_history,
    career_profile: user.career_profile
  });
});

// PUT /api/auth/language
router.put('/language', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.language = req.body.language || 'en';
    await user.save();
    
    setImmediate(() => {
      checkBadges(user, { trigger: 'login' }); // Re-use trigger to potentially unlock multilingual badge
    });

    res.json({ message: 'Language updated', language: user.language });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({ message: 'Failed to update language' });
  }
});

module.exports = router;
