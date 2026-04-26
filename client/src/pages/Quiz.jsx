import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import axios from 'axios';
import { getCachedQuiz, addToQueue, getAllCachedTopics } from '../utils/indexedDB';
import { Link } from 'react-router-dom';

const Quiz = () => {
  const { user, refreshUser } = useAuth();
  const lang = user?.language || 'en';
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [qStart, setQStart] = useState(null);
  const [totalStart, setTotalStart] = useState(null);

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [qCount, setQCount] = useState(10);
  const [cachedTopics, setCachedTopics] = useState([]);
  const [quizCacheRAM, setQuizCacheRAM] = useState({}); // Optimization: RAM Cache

  const getQuestionTime = (type) => {
    if (type === 'coding') return 300;
    if (type === 'theoretical' || type === 'theory') return 90;
    return 30; // mcq defaults to 30s
  };

  useEffect(() => {
    const loadCached = async () => {
      const cached = await getAllCachedTopics();
      setCachedTopics(cached);
      
      // Pre-load IndexedDB into RAM for instant starts
      const ram = {};
      for (const t of cached) {
        ram[t] = await getCachedQuiz(t);
      }
      setQuizCacheRAM(ram);
    };
    loadCached();
  }, []);

  const startQuiz = async (overrideTopic = null) => {
    const topicToUse = overrideTopic || selectedTopic;
    
    // Instant RAM Cache Hit (Optimization)
    if (overrideTopic && quizCacheRAM[overrideTopic]) {
      const qList = quizCacheRAM[overrideTopic].slice(0, qCount);
      setQuestions(qList); setCurrentIdx(0); setAnswers([]); setSelected(null);
      setTextAnswer(''); setSubmitted(false); setResults(null); setTimeLeft(getQuestionTime(qList[0]?.type));
      setQStart(Date.now()); setTotalStart(Date.now());
      return;
    }

    setLoading(true);
    try {
      // 1. Try to fetch from server
      const { data } = await axios.post('/api/quiz/generate', { 
        subject: selectedSubject, 
        topic: topicToUse,
        count: qCount 
      });
      setQuestions(data.questions); setCurrentIdx(0); setAnswers([]); setSelected(null);
      setTextAnswer(''); setSubmitted(false); setResults(null); setTimeLeft(getQuestionTime(data.questions[0]?.type));
      setQStart(Date.now()); setTotalStart(Date.now());
    } catch (err) { 
      // 2. Fallback to cache if offline or server error
      if (topicToUse && quizCacheRAM[topicToUse]) {
        const qList = quizCacheRAM[topicToUse].slice(0, qCount);
        setQuestions(qList);
        setCurrentIdx(0); setAnswers([]); setSelected(null);
        setTextAnswer(''); setSubmitted(false); setResults(null); setTimeLeft(getQuestionTime(qList[0]?.type));
        setQStart(Date.now()); setTotalStart(Date.now());
        setLoading(false);
        return;
      }
      alert(err.response?.data?.message || 'Failed to generate quiz. Try saving it offline first!'); 
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (questions.length > 0 && !submitted && !results && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timeLeft, submitted, results, questions.length]);

  const currentQ = questions[currentIdx];

  const handleSubmitAnswer = () => {
    const timeTaken = qStart ? (Date.now() - qStart) / 1000 : 30;
    const answer = currentQ?.type === 'mcq' ? selected : textAnswer;
    setAnswers(prev => [...prev, { questionIndex: currentIdx, answer, timeTaken }]);
    setSubmitted(true);
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1); setSelected(null); setTextAnswer('');
      setSubmitted(false); setTimeLeft(getQuestionTime(questions[currentIdx + 1]?.type)); setQStart(Date.now());
    } else {
      setLoading(true);
      try {
        const totalTime = totalStart ? (Date.now() - totalStart) / 1000 : 0;
        const { data } = await axios.post('/api/quiz/grade', { answers, questions, timeTaken: totalTime });
        setResults(data); refreshUser();
      } catch (err) { 
        console.error('Grade error:', err);
        // Offline Fallback for grading
        const correctCount = answers.filter((a, idx) => {
          const q = questions[idx];
          if (q.type === 'mcq') return a.answer === q.correctIndex;
          return false; // Theoretical grading requires AI/Server
        }).length;
        const mcqCount = questions.filter(q => q.type === 'mcq').length;
        const scorePercent = mcqCount > 0 ? Math.round((correctCount / mcqCount) * 100) : 0;
        
        setResults({
          scorePercent,
          level: 'Offline',
          results: answers.map((a, idx) => ({
            topic: questions[idx].topic,
            score: (questions[idx].type === 'mcq' && a.answer === questions[idx].correctIndex) ? 100 : 0,
            feedback: questions[idx].type === 'mcq' ? (a.answer === questions[idx].correctIndex ? 'Correct!' : 'Incorrect') : 'Offline: Will be graded when online.'
          }))
        });
        
        // Save to sync queue
        await addToQueue('quiz_result', { answers, questions, timeTaken: totalStart ? (Date.now() - totalStart) / 1000 : 0 });
      }
      finally { setLoading(false); }
    }
  };

  if (results) return (
    <div style={{ width: '100%', maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--section-gap)' }}>{t('quiz_results', lang)}</h1>
      <div className="card" style={{ textAlign: 'center', marginBottom: 'clamp(16px, 4vw, 32px)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(2rem, 8vw, 3rem)', color: results.scorePercent >= 70 ? 'var(--success)' : 'var(--danger)', marginBottom: '8px' }}>{results.scorePercent}%</div>
        <div style={{ color: 'var(--text-secondary)' }}>{t('level', lang)}: {results.level}</div>
      </div>
      {results.results.map((r, i) => (
        <div key={i} className="card" style={{ marginBottom: '12px', borderLeft: `3px solid ${r.score >= 70 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'var(--text-muted)', marginBottom: '4px' }}>{r.topic}</div>
          <div style={{ marginBottom: '4px', fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>{questions[i]?.question}</div>
          <div style={{ color: r.score >= 70 ? 'var(--success)' : 'var(--danger)', fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}>{r.feedback}</div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button className="btn-primary" onClick={() => { setQuestions([]); setResults(null); }} style={{ flex: 1 }}>{t('take_another_quiz', lang)}</button>
        <Link to="/quiz-history" className="btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '16px', textDecoration: 'none' }}>{t('quiz_history', lang)}</Link>
      </div>
    </div>
  );

  if (questions.length === 0) {
    const activeSyllabus = user?.syllabi?.find(s => s._id === user.activeSyllabusId) || user?.syllabi?.[0] || user?.syllabus;
    const subjects = activeSyllabus?.subjects || [];
    const allTopics = selectedSubject 
      ? subjects.find(s => s.name === selectedSubject)?.units.flatMap(u => u.topics) || []
      : subjects.flatMap(s => s.units.flatMap(u => u.topics));

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--section-gap)' }}>
          <h1 style={{ margin: 0 }}>{t('quiz', lang)}</h1>
          <Link to="/quiz-history" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>{t('quiz_history', lang)}</Link>
        </div>
        {subjects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'clamp(2rem, 6vw, 3rem)' }}><p style={{ color: 'var(--text-muted)' }}>{t('upload_syllabus_first', lang)}</p></div>
        ) : (
          <div className="card" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '24px' }}>{t('configure_quiz', lang)}</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.875rem)' }}>{t('select_subject', lang)}</label>
              <select className="input" value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic(''); }} style={{ width: '100%' }}>
                <option value="">{t('all_subjects', lang)}</option>
                {subjects.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.875rem)' }}>{t('select_topic_optional', lang)}</label>
              <select className="input" value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)} style={{ width: '100%' }}>
                <option value="">{t('all_topics_subject', lang)}</option>
                {allTopics.map((t, i) => <option key={i} value={t.name}>{t.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.875rem)' }}>{t('question_count', lang)}</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[10, 18, 25].map(c => (
                  <button 
                    key={c} 
                    className={qCount === c ? "btn-primary" : "btn-secondary"} 
                    style={{ flex: 1, minWidth: '60px' }}
                    onClick={() => setQCount(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={() => startQuiz()} disabled={loading} style={{ width: '100%', padding: '16px' }}>
              {loading ? t('generating', lang) : t('start_quiz', lang)}
            </button>

            {cachedTopics.length > 0 && (
              <div style={{ marginTop: 'var(--section-gap)' }}>
                <h3 style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>{t('ready_offline_study', lang)}</h3>
                <div className="grid-2" style={{ gap: '12px' }}>
                  {cachedTopics.map((topic, i) => (
                    <div 
                      key={i} 
                      className="card" 
                      onClick={() => startQuiz(topic)}
                      style={{ padding: '12px', cursor: 'pointer', border: '1px solid var(--accent)', background: 'var(--accent-light)', position: 'relative' }}
                    >
                      <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', fontWeight: 600 }}>{topic}</div>
                      <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '4px' }}>💾 {t('available_offline', lang)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--section-gap)' }}>{t('quiz', lang)}</h1>
      <div className="card" style={{ padding: 0, overflow: 'hidden', width: '100%', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ width: '100%', height: '4px', background: 'var(--border)' }}>
          <div style={{ height: '100%', width: `${(timeLeft / (currentQ ? getQuestionTime(currentQ.type) : 30)) * 100}%`, background: timeLeft < 10 ? 'var(--danger)' : 'var(--accent)', transition: 'width 1s linear, background 0.3s' }} />
        </div>
        <div style={{ padding: 'clamp(1rem, 4vw, 2rem)' }}>
          <div style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {t('question', lang)} {currentIdx + 1}/{questions.length} • {currentQ?.topic}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', marginBottom: 'clamp(16px, 4vw, 32px)', lineHeight: 1.4 }}>{currentQ?.question}</div>
          {currentQ?.type === 'mcq' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 'clamp(16px, 4vw, 32px)' }}>
              {currentQ.options?.map((opt, idx) => {
                let bc = 'var(--border)', bg = 'var(--surface)';
                if (submitted) { if (idx === currentQ.correctIndex) { bc = 'var(--success)'; bg = '#E6F4ED'; } else if (selected === idx) { bc = 'var(--danger)'; bg = '#FDECEA'; } }
                else if (selected === idx) { bc = 'var(--accent)'; bg = 'var(--accent-light)'; }
                return <div key={idx} onClick={() => !submitted && setSelected(idx)} style={{ border: `1px solid ${bc}`, background: bg, padding: 'clamp(12px, 3vw, 16px)', borderRadius: '6px', cursor: submitted ? 'default' : 'pointer', minHeight: '52px', display: 'flex', alignItems: 'center', fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>{opt}</div>;
              })}
            </div>
          ) : (
            <textarea value={textAnswer} onChange={e => setTextAnswer(e.target.value)} disabled={submitted}
              placeholder={currentQ?.type === 'coding' ? t('write_code', lang) : t('type_answer', lang)}
              style={{ width: '100%', minHeight: 'clamp(100px, 30vh, 200px)', marginBottom: 'clamp(16px, 4vw, 32px)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: currentQ?.type === 'coding' ? 'var(--font-mono)' : 'var(--font-body)', background: currentQ?.type === 'coding' ? 'var(--code-bg)' : 'var(--surface)', resize: 'vertical' }} />
          )}
          {!submitted ? (
            <button className="btn-primary" onClick={handleSubmitAnswer} disabled={currentQ?.type === 'mcq' ? selected === null : !textAnswer.trim()} style={{ width: '100%' }}>{t('submit_answer', lang)}</button>
          ) : (
            <button className="btn-secondary" onClick={handleNext} style={{ width: '100%' }}>{currentIdx < questions.length - 1 ? t('next_question', lang) : loading ? t('grading', lang) : t('see_results', lang)}</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
