const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateQuizQuestions, gradeTheoreticalAnswer } = require('../services/groq');
const { checkBadges } = require('../services/badges');

// POST /api/quiz/generate — Adaptive quiz generation
router.post('/generate', protect, async (req, res) => {
  try {
    const { subject, count = 5 } = req.body;
    const user = req.user;
    const level = user.pacing_profile?.level || 'beginner';
    const language = user.language || 'en';

    // Collect studied topics, prioritize by quiz_priority
    let candidateTopics = [];
    const activeSyllabus = user.getActiveSyllabus();
    if (activeSyllabus?.subjects) {
      const subjects = subject 
        ? activeSyllabus.subjects.filter(s => s.name === subject)
        : activeSyllabus.subjects;
      
      for (const subj of subjects) {
        for (const unit of subj.units) {
          for (const topic of unit.topics) {
            if (topic.studied) {
              candidateTopics.push({ name: topic.name, priority: topic.quiz_priority || 'medium' });
            }
          }
        }
      }
    }

    if (candidateTopics.length === 0) {
      return res.status(400).json({ message: 'No studied topics found. Study some topics first!' });
    }

    // Sort by priority: high first, then medium, then low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    candidateTopics.sort((a, b) => (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1));

    // Take top topics for quiz
    const topicNames = candidateTopics.slice(0, 10).map(t => t.name);
    const subjectContext = { subject: subject || 'Mixed Subjects', topics: topicNames };
    const questions = await generateQuizQuestions(subjectContext, count, level, language);

    res.json({ questions, level, topicCount: topicNames.length });
  } catch (error) {
    console.error('Quiz generate error:', error);
    res.status(500).json({ message: 'Failed to generate quiz' });
  }
});

// POST /api/quiz/grade — Grade quiz answers
router.post('/grade', protect, async (req, res) => {
  try {
    const { answers, questions, timeTaken } = req.body;
    // answers: [{questionIndex, answer (string or index)}]
    // questions: the original questions array
    const user = req.user;
    const language = user.language || 'en';
    let totalScore = 0;
    let totalPoints = 0;
    let fastAnswers = 0;
    const results = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const userAns = answers.find(a => a.questionIndex === i);
      let score = 0;
      let feedback = '';

      if (q.type === 'mcq') {
        totalPoints += 100;
        if (userAns && userAns.answer === q.correctIndex) {
          score = 100;
          feedback = 'Correct!';
        } else {
          score = 0;
          feedback = `Incorrect. Correct answer: ${q.options[q.correctIndex]}`;
        }
      } else {
        // theoretical or coding — grade via Groq
        totalPoints += 100;
        if (userAns && userAns.answer) {
          const graded = await gradeTheoreticalAnswer(q.question, userAns.answer, q.correctAnswer, language);
          score = graded.score || 0;
          feedback = graded.feedback || '';
        } else {
          feedback = 'No answer provided';
        }
      }

      // Check for speed
      if (userAns && userAns.timeTaken && userAns.timeTaken < 15) {
        fastAnswers++;
      }

      totalScore += score;
      results.push({ questionIndex: i, score, feedback, topic: q.topic });
    }

    const scorePercent = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;

    // Update quiz history
    const topicsInQuiz = [...new Set(questions.map(q => q.topic))];
    user.quiz_history.push({
      subject: questions[0]?.topic || 'Mixed',
      topics: topicsInQuiz,
      score: scorePercent,
      total: questions.length,
      date: new Date(),
      time_taken: timeTaken || 0
    });

    // Update gamification
    user.gamification.total_quizzes_taken += 1;

    // Update pacing level
    const avgTime = timeTaken ? timeTaken / questions.length : user.pacing_profile.avg_time_per_q;
    user.pacing_profile.avg_time_per_q = avgTime;
    
    if (avgTime > 40 && user.pacing_profile.level !== 'beginner') {
      const levels = ['beginner', 'intermediate', 'advanced'];
      const idx = levels.indexOf(user.pacing_profile.level);
      if (idx > 0) user.pacing_profile.level = levels[idx - 1];
    } else if (avgTime < 15 && scorePercent >= 70 && user.pacing_profile.level !== 'advanced') {
      const levels = ['beginner', 'intermediate', 'advanced'];
      const idx = levels.indexOf(user.pacing_profile.level);
      if (idx < 2) user.pacing_profile.level = levels[idx + 1];
    }

    // Update last_tested on topics
    const activeSyllabus = user.getActiveSyllabus();
    if (activeSyllabus?.subjects) {
      for (const subj of activeSyllabus.subjects) {
        for (const unit of subj.units) {
          for (const topic of unit.topics) {
            if (topicsInQuiz.includes(topic.name)) {
              topic.last_tested = new Date();
              // Update topic score
              const topicResults = results.filter(r => r.topic === topic.name);
              if (topicResults.length > 0) {
                topic.score = Math.round(topicResults.reduce((sum, r) => sum + r.score, 0) / topicResults.length);
              }
            }
          }
        }
      }
    }

    await user.save();

    // Check for first attempt (no previous quiz on same topics)
    const prevQuizzes = user.quiz_history.filter(q => 
      q.topics.some(t => topicsInQuiz.includes(t))
    );
    const isFirstAttempt = prevQuizzes.length <= 1;

    // Check for comeback kid
    let improvement = 0;
    if (prevQuizzes.length >= 2) {
      const prevScore = prevQuizzes[prevQuizzes.length - 2].score;
      improvement = scorePercent - prevScore;
    }

    // Non-blocking badge checks
    setImmediate(() => {
      checkBadges(user, { trigger: 'grade', scorePercent, isFirstAttempt, fastAnswers, improvement });
    });

    res.json({ results, scorePercent, level: user.pacing_profile.level, totalQuizzes: user.gamification.total_quizzes_taken });
  } catch (error) {
    console.error('Quiz grade error:', error);
    res.status(500).json({ message: 'Failed to grade quiz' });
  }
});

// POST /api/quiz/pregenerate — Pre-generate questions for offline cache
router.post('/pregenerate', protect, async (req, res) => {
  try {
    const user = req.user;
    const level = user.pacing_profile?.level || 'beginner';
    const language = user.language || 'en';

    // Find weak + due topics
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const targetTopics = [];
    
    const activeSyllabus = user.getActiveSyllabus();
    if (activeSyllabus?.subjects) {
      for (const subj of activeSyllabus.subjects) {
        for (const unit of subj.units) {
          for (const topic of unit.topics) {
            if (topic.studied && (topic.quiz_priority === 'high' || 
                (topic.last_tested && new Date(topic.last_tested) <= sevenDaysAgo))) {
              targetTopics.push(topic.name);
            }
          }
        }
      }
    }

    if (targetTopics.length === 0) {
      return res.json({ questions: [], message: 'No weak/due topics found' });
    }

    const subjectContext = { subject: 'Mixed Offline Cache', topics: targetTopics.slice(0, 10) };
    const questions = await generateQuizQuestions(subjectContext, 20, level, language);
    res.json({ questions, topicCount: targetTopics.length });
  } catch (error) {
    console.error('Pregenerate error:', error);
    res.status(500).json({ message: 'Failed to pregenerate questions' });
  }
});

module.exports = router;
