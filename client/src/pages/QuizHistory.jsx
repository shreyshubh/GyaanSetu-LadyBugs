import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';

const QuizHistory = () => {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const history = [...(user?.quiz_history || [])].reverse();

  if (selectedQuiz) {
    return (
      <div style={{ width: '100%', maxWidth: '720px', margin: '0 auto' }}>
        <button 
          className="btn-secondary" 
          onClick={() => setSelectedQuiz(null)} 
          style={{ marginBottom: '16px' }}
        >
          ← {t('history', lang)}
        </button>
        <h1 style={{ marginBottom: '24px' }}>{selectedQuiz.subject} {t('quiz_results', lang)}</h1>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('score', lang)}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: selectedQuiz.score >= 70 ? 'var(--success)' : 'var(--danger)' }}>
              {selectedQuiz.score}%
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('level', lang)}</div>
            <div style={{ fontSize: '1.2rem', textTransform: 'capitalize' }}>{selectedQuiz.level || 'Beginner'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('date', lang)}</div>
            <div style={{ fontSize: '1rem' }}>{new Date(selectedQuiz.date).toLocaleDateString()}</div>
          </div>
        </div>

        {selectedQuiz.results && selectedQuiz.results.length > 0 ? (
          selectedQuiz.results.map((r, i) => (
            <div key={i} className="card" style={{ marginBottom: '16px', borderLeft: `3px solid ${r.score >= 70 ? 'var(--success)' : 'var(--danger)'}` }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{r.topic}</div>
              <div style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: '500' }}>{r.question}</div>
              
              <div style={{ marginBottom: '8px', padding: '8px', background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('your_answer', lang)}</div>
                <div style={{ fontSize: '0.9rem' }}>{r.userAnswer}</div>
              </div>

              <div style={{ marginBottom: '8px', padding: '8px', background: '#E6F4ED', color: '#005A32', borderRadius: '4px', border: '1px solid var(--success)' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{t('correct_answer', lang)}</div>
                <div style={{ fontSize: '0.9rem' }}>{r.correctAnswer}</div>
              </div>

              {r.feedback && r.feedback !== 'Correct!' && r.feedback !== 'Incorrect' && !r.feedback.startsWith('Incorrect. Correct answer:') && (
                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  <span style={{ fontWeight: 'bold' }}>{t('feedback', lang)}:</span> {r.feedback}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No detailed results available for this past attempt.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--section-gap)' }}>{t('quiz_history', lang)}</h1>
      
      {history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'clamp(2rem, 6vw, 3rem)' }}>
          <p style={{ color: 'var(--text-muted)' }}>{t('no_recent_quizzes', lang)}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.map((q, i) => (
            <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{q.subject}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(q.date).toLocaleDateString()} • {q.topics.length} Topics
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: q.score >= 70 ? 'var(--success)' : 'var(--danger)' }}>
                    {q.score}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {t('level', lang)}: {q.level || 'Beginner'}
                  </div>
                </div>
              </div>
              <button 
                className="btn-secondary" 
                style={{ width: '100%', padding: '8px' }}
                onClick={() => setSelectedQuiz(q)}
              >
                {t('view_answers', lang)}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizHistory;
