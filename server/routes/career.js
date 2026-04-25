const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateCareerGuidance, getSalaryData } = require('../services/groq');
const { searchVideos } = require('../services/youtube');
const { checkBadges } = require('../services/badges');

// GET /api/career/guidance — Career role mapping + learning resources + salary + higher ed + scholarships
router.get('/guidance', protect, async (req, res) => {
  try {
    const user = req.user;
    const language = user.language || 'en';
    const forceRefresh = req.query.refresh === 'true';

    // Check if salary cache is fresh (24 hours)
    const salaryCacheAge = user.career_profile?.salary_cached_at
      ? (Date.now() - new Date(user.career_profile.salary_cached_at).getTime())
      : Infinity;
    const salaryStale = salaryCacheAge > 24 * 60 * 60 * 1000;

    // If we have cached roles and user didn't ask for refresh, return cache
    if (!forceRefresh && user.career_profile?.cached_roles?.length > 0) {
      return res.json({ 
        roles: user.career_profile.cached_roles, 
        resources: user.career_profile.cached_resources,
        strongTopics: user.career_profile.strong,
        weakTopics: user.career_profile.weak,
        higher_education: user.career_profile.cached_higher_education || [],
        scholarships: user.career_profile.cached_scholarships || []
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

    // Get career recommendations from Groq (now includes higher_education + scholarships)
    const careerResult = await generateCareerGuidance(studiedTopics, unstudiedTopics, language);
    const roles = careerResult.roles || [];
    const higher_education = careerResult.higher_education || [];
    const scholarships = careerResult.scholarships || [];

    // Fetch salary data for roles
    let salaryData = [];
    if (roles.length > 0) {
      try {
        salaryData = await getSalaryData(roles.map(r => r.title));
      } catch (err) {
        console.warn('Salary data fetch failed:', err.message);
      }
    }

    // Attach salary data to roles
    for (const role of roles) {
      const salary = salaryData.find(s => s.role === role.title);
      if (salary) {
        role.min_lpa = salary.min_lpa;
        role.max_lpa = salary.max_lpa;
        role.avg_lpa = salary.avg_lpa;
        role.source_note = salary.source_note;
      }
    }

    // Fetch YouTube resources for skill gaps
    const allGaps = [...new Set(roles.flatMap(r => r.gaps || []))];
    const resources = [];
    
    for (const gap of allGaps.slice(0, 5)) {
      const videos = await searchVideos(gap, 2);
      resources.push({ topic: gap, videos });
    }

    // Update career profile with all data
    user.career_profile = {
      strong: strongTopics,
      weak: weakTopics,
      cached_roles: roles,
      cached_resources: resources,
      cached_higher_education: higher_education,
      cached_scholarships: scholarships,
      salary_cached_at: new Date()
    };
    await user.save();

    // Non-blocking badge check
    setImmediate(() => { checkBadges(user, { trigger: 'career' }); });

    res.json({ roles, resources, strongTopics, weakTopics, higher_education, scholarships });
  } catch (error) {
    console.error('Career guidance error:', error);
    res.status(500).json({ message: 'Failed to generate career guidance' });
  }
});

module.exports = router;
