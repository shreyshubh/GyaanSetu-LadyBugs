import { useState } from 'react';

const mockSyllabus = [
  {
    name: 'Data Structures',
    units: [
      {
        name: 'Unit 1: Arrays',
        topics: [
          { name: 'Arrays & Memory Layout', confidence: 'confident', studied: true },
          { name: 'Singly Linked List', confidence: 'neutral', studied: true }
        ]
      },
      {
        name: 'Unit 2: Trees',
        topics: [
          { name: 'Binary Search Tree', confidence: 'weak', studied: true },
          { name: 'AVL Trees', confidence: 'neutral', studied: false }
        ]
      }
    ]
  }
];

import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import { useNavigate } from 'react-router-dom';

const Syllabus = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = user?.language || 'en';
  const [uploaded, setUploaded] = useState(false);
  const [data, setData] = useState(mockSyllabus);

  if (!uploaded) {
    return (
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '32px' }}>{t('syllabus', lang)}</h1>
        <div 
          onClick={() => setUploaded(true)}
          style={{ 
            border: '2px dashed var(--border)', 
            borderRadius: '6px', 
            padding: '64px 32px', 
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--surface)'
          }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>📄</div>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '8px' }}>{t('upload_syllabus', lang)}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Click or drag a PDF/DOCX file here</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '32px' }}>{t('syllabus', lang)}</h1>
      
      {data.map((subject, sIdx) => (
        <div key={sIdx} className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: 'var(--text-lg)' }}>{subject.name}</h2>
            <button className="btn-secondary">Edit</button>
          </div>
          
          <div style={{ paddingLeft: '16px' }}>
            {subject.units.map((unit, uIdx) => (
              <div key={uIdx} style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: 'var(--text-md)', marginBottom: '12px' }}>{unit.name}</h3>
                
                <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {unit.topics.map((topic, tIdx) => (
                    <div key={tIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input type="checkbox" checked={topic.studied} readOnly style={{ width: '16px', height: '16px', margin: 0 }} />
                        <span>{topic.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className={`tag tag-confident`} style={{ opacity: topic.confidence === 'confident' ? 1 : 0.3 }}>{t('confident', lang)}</span>
                        <span className={`tag tag-neutral`} style={{ opacity: topic.confidence === 'neutral' ? 1 : 0.3 }}>{t('neutral', lang)}</span>
                        <span className={`tag tag-weak`} style={{ opacity: topic.confidence === 'weak' ? 1 : 0.3 }}>{t('weak', lang)}</span>
                        <button 
                          onClick={() => navigate('/notes')}
                          className="btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '11px', marginLeft: '8px' }}
                        >
                          {t('generate_notes', lang)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Syllabus;
