import { useState, useEffect } from 'react';

const mockQuestion = {
  id: 'q1',
  topic: 'Binary Search Tree',
  subject: 'Data Structures',
  type: 'mcq',
  question: 'What is the worst-case time complexity of searching in a standard Binary Search Tree?',
  options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
  correctIndex: 2
};

import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';

const Quiz = () => {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [timeLeft, setTimeLeft] = useState(30);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, submitted]);

  return (
    <div>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '32px' }}>{t('quiz', lang)}</h1>

      <div className="card" style={{ padding: 0, overflow: 'hidden', maxWidth: '800px', margin: '0 auto' }}>
        {/* Timer Bar */}
        <div style={{ width: '100%', height: '2px', background: 'var(--border)' }}>
          <div style={{
            height: '100%',
            width: `${(timeLeft / 30) * 100}%`,
            background: timeLeft < 10 ? 'var(--danger)' : 'var(--accent)',
            transition: 'width 1s linear, background 0.3s'
          }}></div>
        </div>

        <div style={{ padding: '32px' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Question 1 • {mockQuestion.topic}
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: '32px' }}>
            {mockQuestion.question}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {mockQuestion.options.map((opt, idx) => {
              const isSelected = selected === idx;
              let borderColor = 'var(--border)';
              let bg = 'var(--surface)';

              if (submitted) {
                if (idx === mockQuestion.correctIndex) {
                  borderColor = 'var(--success)';
                  bg = '#E6F4ED';
                } else if (isSelected) {
                  borderColor = 'var(--danger)';
                  bg = '#FDECEA';
                }
              } else if (isSelected) {
                borderColor = 'var(--accent)';
                bg = 'var(--accent-light)';
              }

              return (
                <div
                  key={idx}
                  onClick={() => !submitted && setSelected(idx)}
                  style={{
                    border: `1px solid ${borderColor}`,
                    background: bg,
                    padding: '16px',
                    borderRadius: '6px',
                    cursor: submitted ? 'default' : 'pointer'
                  }}
                >
                  {opt}
                </div>
              );
            })}
          </div>

          {!submitted ? (
            <button
              className="btn-primary"
              onClick={() => setSubmitted(true)}
              disabled={selected === null}
              style={{ width: '100%', opacity: selected === null ? 0.5 : 1 }}
            >
              Submit Answer
            </button>
          ) : (
            <div>
              <div style={{ marginBottom: '16px', color: selected === mockQuestion.correctIndex ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                {selected === mockQuestion.correctIndex ? 'Correct!' : 'Incorrect.'}
              </div>
              <button className="btn-secondary" style={{ width: '100%' }}>Next Question</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
