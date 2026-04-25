const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateCareerGuidance } = require('../services/groq');
const { searchVideos } = require('../services/youtube');
const { checkBadges } = require('../services/badges');

// GET /api/career/guidance — Career role mapping + learning resources
router.get('/guidance', protect, async (req, res) => {
  try {
    const user = req.user;
    const language = user.language || 'en';
    const forceRefresh = req.query.refresh === 'true';

    // If we have cached roles and user didn't ask for refresh, return cache
    if (!forceRefresh && user.career_profile?.cached_roles?.length > 0) {
      return res.json({ 
        roles: user.career_profile.cached_roles, 
        resources: user.career_profile.cached_resources,
        strongTopics: user.career_profile.strong,
        weakTopics: user.career_profile.weak
      });
    }

    // Determine studied/unstudied topics from syllabus
    const studiedTopics = [];
    const unstudiedTopics = [];
    const strongTopics = [];
    const weakTopics = [];
    
    const activeSyllabus = user.getActiveSyllabus();
    if (activeSyllabus?.subjects) {
      for (const subj of activeSyllabus.subjects) {
        for (const unit of subj.units) {
          for (const topic of unit.topics) {
            if (topic.studied) studiedTopics.push(topic.name);
            else unstudiedTopics.push(topic.name);
            
            if (topic.confidence === 'confident' && topic.studied) strongTopics.push(topic.name);
            else if (topic.confidence === 'weak' || (!topic.studied && topic.confidence !== 'confident')) weakTopics.push(topic.name);
          }
        }
      }
    }

    // Get career recommendations from Groq
    const roles = await generateCareerGuidance(studiedTopics, unstudiedTopics, language);

    // Fetch YouTube resources for skill gaps
    const allGaps = [...new Set(roles.flatMap(r => r.gaps || []))];
    const resources = [];
    
    for (const gap of allGaps.slice(0, 5)) {
      const videos = await searchVideos(gap, 2);
      resources.push({ topic: gap, videos });
    }

    // Update career profile
    user.career_profile = {
      strong: strongTopics,
      weak: weakTopics,
      cached_roles: roles,
      cached_resources: resources
    };
    await user.save();

    // Non-blocking badge check
    setImmediate(() => { checkBadges(user, { trigger: 'career' }); });

    res.json({ roles, resources, strongTopics, weakTopics });
  } catch (error) {
    console.error('Career guidance error:', error);
    res.status(500).json({ message: 'Failed to generate career guidance' });
  }
});

module.exports = router;
