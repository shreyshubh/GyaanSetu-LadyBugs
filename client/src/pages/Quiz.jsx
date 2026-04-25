import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import axios from 'axios';

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

  const startQuiz = async (subject) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/quiz/generate', { subject, count: 5 });
      setQuestions(data.questions); setCurrentIdx(0); setAnswers([]); setSelected(null);
      setTextAnswer(''); setSubmitted(false); setResults(null); setTimeLeft(30);
      setQStart(Date.now()); setTotalStart(Date.now());
    } catch (err) { alert(err.response?.data?.message || 'Failed to generate quiz'); }
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
      setSubmitted(false); setTimeLeft(30); setQStart(Date.now());
    } else {
      setLoading(true);
      try {
        const totalTime = totalStart ? (Date.now() - totalStart) / 1000 : 0;
        const { data } = await axios.post('/api/quiz/grade', { answers, questions, timeTaken: totalTime });
        setResults(data); refreshUser();
      } catch (err) { console.error('Grade error:', err); }
      finally { setLoading(false); }
    }
  };

  if (results) return (
    <div>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '32px' }}>Quiz Results</h1>
      <div className="card" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', color: results.scorePercent >= 70 ? 'var(--success)' : 'var(--danger)', marginBottom: '8px' }}>{results.scorePercent}%</div>
        <div style={{ color: 'var(--text-secondary)' }}>Level: {results.level}</div>
      </div>
      {results.results.map((r, i) => (
        <div key={i} className="card" style={{ marginBottom: '12px', borderLeft: `3px solid ${r.score >= 70 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>{r.topic}</div>
          <div style={{ marginBottom: '4px' }}>{questions[i]?.question}</div>
          <div style={{ color: r.score >= 70 ? 'var(--success)' : 'var(--danger)', fontSize: 'var(--text-sm)' }}>{r.feedback}</div>
        </div>
      ))}
      <button className="btn-primary" onClick={() => { setQuestions([]); setResults(null); }} style={{ width: '100%', marginTop: '24px' }}>Take Another Quiz</button>
    </div>
  );

  if (questions.length === 0) {
    const activeSyllabus = user?.syllabi?.find(s => s._id === user.activeSyllabusId) || user?.syllabi?.[0] || user?.syllabus;
    const subjects = activeSyllabus?.subjects || [];
    return (
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '32px' }}>{t('quiz', lang)}</h1>
        {subjects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}><p style={{ color: 'var(--text-muted)' }}>Upload a syllabus and study some topics first!</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button className="btn-primary" onClick={() => startQuiz()} disabled={loading}>{loading ? 'Generating...' : 'Quiz on All Subjects'}</button>
            {subjects.map((s, i) => <button key={i} className="btn-secondary" onClick={() => startQuiz(s.name)} disabled={loading}>{s.name}</button>)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '32px' }}>{t('quiz', lang)}</h1>
      <div className="card" style={{ padding: 0, overflow: 'hidden', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ width: '100%', height: '2px', background: 'var(--border)' }}>
          <div style={{ height: '100%', width: `${(timeLeft / 30) * 100}%`, background: timeLeft < 10 ? 'var(--danger)' : 'var(--accent)', transition: 'width 1s linear, background 0.3s' }} />
        </div>
        <div style={{ padding: '32px' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Question {currentIdx + 1}/{questions.length} • {currentQ?.topic}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: '32px' }}>{currentQ?.question}</div>
          {currentQ?.type === 'mcq' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {currentQ.options?.map((opt, idx) => {
                let bc = 'var(--border)', bg = 'var(--surface)';
                if (submitted) { if (idx === currentQ.correctIndex) { bc = 'var(--success)'; bg = '#E6F4ED'; } else if (selected === idx) { bc = 'var(--danger)'; bg = '#FDECEA'; } }
                else if (selected === idx) { bc = 'var(--accent)'; bg = 'var(--accent-light)'; }
                return <div key={idx} onClick={() => !submitted && setSelected(idx)} style={{ border: `1px solid ${bc}`, background: bg, padding: '16px', borderRadius: '6px', cursor: submitted ? 'default' : 'pointer' }}>{opt}</div>;
              })}
            </div>
          ) : (
            <textarea value={textAnswer} onChange={e => setTextAnswer(e.target.value)} disabled={submitted}
              placeholder={currentQ?.type === 'coding' ? 'Write your code...' : 'Type your answer...'}
              style={{ width: '100%', minHeight: '120px', marginBottom: '32px', padding: '16px', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: currentQ?.type === 'coding' ? 'var(--font-mono)' : 'var(--font-body)', background: currentQ?.type === 'coding' ? 'var(--code-bg)' : 'var(--surface)', resize: 'vertical' }} />
          )}
          {!submitted ? (
            <button className="btn-primary" onClick={handleSubmitAnswer} disabled={currentQ?.type === 'mcq' ? selected === null : !textAnswer.trim()} style={{ width: '100%' }}>Submit Answer</button>
          ) : (
            <button className="btn-secondary" onClick={handleNext} style={{ width: '100%' }}>{currentIdx < questions.length - 1 ? 'Next Question' : loading ? 'Grading...' : 'See Results'}</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
